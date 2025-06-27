'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getVendorKeys } from '../../services/vendorUtils';
import { supabase } from '../../services/supabaseClient';

export default function VendorSelectionPage() {
  const router = useRouter();
  const vendors = getVendorKeys();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing preferences and ensure auth
  useEffect(() => {
    async function load() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_vendors')
        .eq('user_id', user.id)
        .single();
      if (data?.preferred_vendors) {
        setSelected(data.preferred_vendors);
      }
      if (error) {
        setError(error.message);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const toggleVendor = (vendor: string) => {
    setSelected(current =>
      current.includes(vendor)
        ? current.filter(v => v !== vendor)
        : [...current, vendor]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_vendors: selected })
      .eq('user_id', user.id);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Select Preferred Vendors</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {vendors.map(vendor => (
            <label key={vendor} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selected.includes(vendor)}
                onChange={() => toggleVendor(vendor)}
              />
              <span className="capitalize">{vendor}</span>
            </label>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      )}
    </div>
  );
}
