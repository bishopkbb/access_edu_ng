import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FORUM_CATEGORIES, listPosts, createPost } from "../services/forumService";
import { Search, Plus, Tag, MessageSquare, ThumbsUp, Bookmark } from "lucide-react";

export default function Forum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", imageUrl: "", attachments: [] });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPosts({ categoryId, sort, search });
      setPosts(data);
    } catch (e) {
      setError("Failed to load forum posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [categoryId, sort, search]);

  const Attachment = ({ a }) => {
    if (a.type === 'image') {
      return <img src={a.url} alt={a.name || 'image'} className="mt-2 rounded-lg max-h-48 object-cover" />;
    }
    if (a.type === 'video') {
      return <video controls className="mt-2 rounded-lg max-h-48 w-full"><source src={a.url} type="video/mp4" /></video>;
    }
    return <a href={a.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 underline">{a.name || 'Attachment'}</a>;
  };

  const PostCard = ({ post }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25 }}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm cursor-pointer"
      onClick={() => navigate(`/forum/post/${post.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <img src={post.authorPhoto || "https://i.pravatar.cc/32"} alt="author" className="w-6 h-6 rounded-full" />
          <span>{post.authorName}</span>
          <span>•</span>
          <span>{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : "Just now"}</span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center">
          <Tag className="w-3 h-3 mr-1" /> {FORUM_CATEGORIES.find(c => c.id === post.categoryId)?.name || "General"}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900">{post.title}</h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.body}</p>
      {Array.isArray(post.attachments) && post.attachments.slice(0,1).map((a, i) => (
        <Attachment key={i} a={a} />
      ))}
      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
        <span className="flex items-center"><ThumbsUp className="w-4 h-4 mr-1" /> {post.likes?.length || 0}</span>
        <span className="flex items-center"><MessageSquare className="w-4 h-4 mr-1" /> {post.commentsCount || 0}</span>
        <span className="flex items-center"><Bookmark className="w-4 h-4 mr-1" /> {(post.bookmarks?.length || 0)}</span>
      </div>
    </motion.div>
  );

  const onCreate = async () => {
    if (!user) { navigate("/"); return; }
    if (!draft.title.trim()) return;
    await createPost({ title: draft.title, body: draft.body, categoryId, author: user, imageUrl: draft.imageUrl });
    setDraft({ title: "", body: "", imageUrl: "", attachments: [] });
    setShowComposer(false);
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowComposer((v) => !v)}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> New Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategoryId("all")} className={`px-3 py-1 rounded-full text-sm border ${categoryId === 'all' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700'}`}>All</button>
            {FORUM_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)} className={`px-3 py-1 rounded-full text-sm border ${categoryId === c.id ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700'}`}>{c.name}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Composer */}
        {showComposer && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Post title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
            />
            <textarea
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder="Write something..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input
                value={draft.imageUrl}
                onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                placeholder="Image URL (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <input
                onChange={(e) => {
                  const url = e.target.value.trim();
                  if (!url) return;
                  setDraft((d) => ({ ...d, attachments: [...(d.attachments||[]), { type: 'file', url }] }));
                  e.target.value = '';
                }}
                placeholder="Attachment URL (file/video)"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <select
                onChange={(e) => {
                  const type = e.target.value;
                  if (!type) return;
                  // turn last attachment into selected type if untyped
                }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Attachment Type</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="file">Document</option>
              </select>
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={onCreate} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Publish</button>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-600">No posts yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


