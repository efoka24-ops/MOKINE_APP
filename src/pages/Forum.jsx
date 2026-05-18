import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../API';

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: '📋' },
  { id: 'disease', label: 'Maladies', icon: '🦠' },
  { id: 'nutrition', label: 'Nutrition', icon: '🌿' },
  { id: 'reproduction', label: 'Reproduction', icon: '🐣' },
  { id: 'general', label: 'Général', icon: '💬' },
  { id: 'alert', label: 'Alertes', icon: '⚠️' },
];

export default function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [category, search]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const res = await apiClient.get('/vet/forum', { params });
      setPosts(res.data.posts || res.data || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await apiClient.post(`/vet/forum/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
      if (selectedPost?.id === postId) setSelectedPost(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    } catch {}
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;
    try {
      const res = await apiClient.post(`/vet/forum/${postId}/replies`, { content: replyText });
      const newReply = res.data.reply || { id: Date.now(), content: replyText, authorName: user?.name, createdAt: new Date() };
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => ({ ...prev, replies: [...(prev.replies || []), newReply] }));
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, replyCount: (p.replyCount || 0) + 1 } : p));
      setReplyText('');
    } catch {}
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setPosting(true);
    try {
      const res = await apiClient.post('/vet/forum', {
        ...newPost,
        tags: newPost.tags ? newPost.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      setPosts(prev => [res.data.post || { id: Date.now(), ...newPost, authorName: user?.name, likes: 0, replyCount: 0, createdAt: new Date() }, ...prev]);
      setShowNewPost(false);
      setNewPost({ title: '', content: '', category: 'general', tags: '' });
    } catch {}
    setPosting(false);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🌱 Forum Communautaire</h1>
          <p className="text-sm text-gray-500 mt-0.5">Échangez avec éleveurs et vétérinaires</p>
        </div>
        {user && (
          <button
            onClick={() => setShowNewPost(true)}
            className="bg-[#178A3B] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#136B2F] font-medium"
          >
            + Nouveau post
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher dans le forum..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === c.id ? 'bg-[#178A3B] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Post list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Chargement...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-medium">Aucun post pour l'instant</p>
              <p className="text-sm mt-1">Soyez le premier à poster !</p>
            </div>
          ) : (
            posts.map(post => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-green-400 transition-all ${selectedPost?.id === post.id ? 'border-green-500 shadow-sm' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        post.category === 'alert' ? 'bg-red-100 text-red-700' :
                        post.category === 'disease' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {CATEGORIES.find(c => c.id === post.category)?.icon} {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                      </span>
                      {post.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{post.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>✍️ {post.authorName || 'Anonyme'}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); handleLike(post.id); }} className="flex flex-col items-center hover:text-red-500 transition-colors">
                      <span className="text-base">❤️</span>
                      <span>{post.likes || 0}</span>
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-base">💬</span>
                      <span>{post.replyCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Post detail / replies */}
        <div className="lg:col-span-1">
          {selectedPost ? (
            <div className="bg-white rounded-xl border p-4 sticky top-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-sm flex-1">{selectedPost.title}</h3>
                <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600 ml-2 text-lg leading-none">×</button>
              </div>
              <p className="text-sm text-gray-700">{selectedPost.content}</p>
              <div className="text-xs text-gray-400 pb-3 border-b">
                Par {selectedPost.authorName} · {new Date(selectedPost.createdAt).toLocaleDateString('fr-FR')}
              </div>

              {/* Replies */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Réponses ({(selectedPost.replies || []).length})
                </h4>
                {(selectedPost.replies || []).map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{r.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.authorName} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              {user && (
                <div className="space-y-2 pt-2 border-t">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Votre réponse..."
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                  <button
                    onClick={() => handleReply(selectedPost.id)}
                    disabled={!replyText.trim()}
                    className="w-full bg-[#178A3B] text-white text-sm py-2 rounded-lg hover:bg-[#136B2F] disabled:opacity-50"
                  >
                    Répondre
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
              <div className="text-3xl mb-2">👆</div>
              <p className="text-sm">Cliquez sur un post pour lire les détails et répondre</p>
            </div>
          )}
        </div>
      </div>

      {/* New post modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Nouveau post</h3>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <input
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre du post *"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <textarea
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                placeholder="Décrivez votre question ou partagez votre expérience... *"
                required
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newPost.category}
                  onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
                <input
                  value={newPost.tags}
                  onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                  placeholder="Tags (séparés par virgule)"
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewPost(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={posting} className="flex-1 bg-[#178A3B] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#136B2F] disabled:opacity-50">
                  {posting ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
