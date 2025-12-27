import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { AppRoutes } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const getProfile = async () => {
      try {
        if (!user) return;
        setLoading(true);

        const { data, error, status } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
        } else {
          // If no profile exists yet (race condition with trigger), fall back to Auth metadata
          setFullName(user.name || '');
        }
      } catch (error: any) {
        console.error('Error loading user data!', error.message);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      // Update global context so the navbar reflects changes immediately
      await updateUser();
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Error updating profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Update Profile with new Avatar URL
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            avatar_url: data.publicUrl,
            updated_at: new Date().toISOString(),
          });
        
        if (updateError) throw updateError;
        
        setAvatarUrl(data.publicUrl);
        // Update global context
        await updateUser();
        
        setMessage({ text: 'Avatar uploaded successfully!', type: 'success' });
      }

    } catch (error: any) {
      setMessage({ text: error.message || 'Error uploading avatar', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <div className="text-center text-slate-400 mt-10">Please log in to view settings.</div>;

  // Safe Fallback for Avatar Initials
  const getInitials = () => {
    if (fullName && fullName.length > 0) return fullName.charAt(0).toUpperCase();
    if (user.email && user.email.length > 0) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link to={AppRoutes.GENERATOR} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Generator
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account information</p>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="relative group w-32 h-32">
              <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-500">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              
              {/* Overlay for upload */}
              <label 
                htmlFor="avatar-upload" 
                className={`
                  absolute inset-0 bg-black/50 rounded-full flex items-center justify-center 
                  opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
                  ${uploading ? 'opacity-100' : ''}
                `}
              >
                {uploading ? (
                  <svg className="animate-spin w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                )}
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading}
                className="hidden" 
              />
            </div>
            <p className="text-xs text-slate-500">Click to upload image</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleUpdateProfile} className="flex-grow space-y-6">
            <Input 
              label="Email" 
              value={user.email} 
              disabled 
              className="opacity-50 cursor-not-allowed"
            />
            
            <Input 
              label="Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />

            <Button type="submit" isLoading={loading} disabled={uploading}>
              Save Changes
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Settings;