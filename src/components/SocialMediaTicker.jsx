import React, { useState, useEffect } from 'react';
import { Youtube, Instagram, Facebook, Users, TrendingUp, RefreshCw } from 'lucide-react';

const SocialMediaTicker = () => {
  const [followerCounts, setFollowerCounts] = useState({
    youtube: { count: 0, loading: true, error: null },
    instagram: { count: 0, loading: true, error: null },
    facebook: { count: 0, loading: true, error: null }
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchFollowerCounts = async () => {
    try {
      const response = await fetch('/api/social-media/counts');
      const data = await response.json();
      
      if (response.ok) {
        setFollowerCounts({
          youtube: { count: data.youtube || 0, loading: false, error: null },
          instagram: { count: data.instagram || 0, loading: false, error: null },
          facebook: { count: data.facebook || 0, loading: false, error: null }
        });
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch follower counts');
      }
    } catch (error) {
      console.error('Error fetching follower counts:', error);
      setFollowerCounts(prev => ({
        youtube: { ...prev.youtube, loading: false, error: error.message },
        instagram: { ...prev.instagram, loading: false, error: error.message },
        facebook: { ...prev.facebook, loading: false, error: error.message }
      }));
    }
  };

  useEffect(() => {
    fetchFollowerCounts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFollowerCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const SocialStat = ({ platform, data, icon: Icon, color }) => (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-white/70 capitalize">{platform}</div>
        <div className="text-lg font-semibold">
          {data.loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : data.error ? (
            <span className="text-red-400">Error</span>
          ) : (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {formatCount(data.count)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-8 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Live Follower Counts
          </h2>
          <p className="text-white/70">
            Real-time social media growth across all platforms
          </p>
          {lastUpdated && (
            <p className="text-sm text-white/50 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SocialStat
            platform="YouTube"
            data={followerCounts.youtube}
            icon={Youtube}
            color="bg-red-500/20 text-red-400"
          />
          <SocialStat
            platform="Instagram"
            data={followerCounts.instagram}
            icon={Instagram}
            color="bg-pink-500/20 text-pink-400"
          />
          <SocialStat
            platform="Facebook"
            data={followerCounts.facebook}
            icon={Facebook}
            color="bg-blue-500/20 text-blue-400"
          />
        </div>

        <div className="text-center mt-4">
          <button
            onClick={fetchFollowerCounts}
            disabled={Object.values(followerCounts).some(stat => stat.loading)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${Object.values(followerCounts).some(stat => stat.loading) ? 'animate-spin' : ''}`} />
            Refresh Counts
          </button>
        </div>
      </div>
    </section>
  );
};

export default SocialMediaTicker;
