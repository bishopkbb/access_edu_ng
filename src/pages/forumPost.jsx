import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { getPost, listComments, addComment, toggleLike, toggleBookmark, FORUM_CATEGORIES } from "../services/forumService";
import { ArrowLeft, ThumbsUp, Bookmark, Send } from "lucide-react";

export default function ForumPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");

  const load = async () => {
    setLoading(true);
    const p = await getPost(postId);
    const c = await listComments(postId);
    setPost(p);
    setComments(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, [postId]);

  const onLike = async () => { if (!user) return navigate("/"); await toggleLike(postId, user.uid); await load(); };
  const onBookmark = async () => { if (!user) return navigate("/"); await toggleBookmark(postId, user.uid); await load(); };
  const onComment = async () => { if (!user || !draft.trim()) return; await addComment({ postId, body: draft, author: user }); setDraft(""); await load(); };

  if (loading) return <div className="min-h-screen bg-gray-50" />;
  if (!post) return <div className="min-h-screen bg-gray-50 p-6">Post not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{FORUM_CATEGORIES.find(c => c.id === post.categoryId)?.name || 'General'}</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <img src={post.authorPhoto || "https://i.pravatar.cc/32"} alt="author" className="w-7 h-7 rounded-full" />
            <span>{post.authorName}</span>
            <span>•</span>
            <span>{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : "Just now"}</span>
          </div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">{post.title}</h1>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{post.body}</p>
          <div className="mt-4 flex items-center space-x-3">
            <button onClick={onLike} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center text-sm"><ThumbsUp className="w-4 h-4 mr-1" /> {post.likes?.length || 0}</button>
            <button onClick={onBookmark} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center text-sm"><Bookmark className="w-4 h-4 mr-1" /> {(post.bookmarks?.length || 0)}</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <img src={c.authorPhoto || "https://i.pravatar.cc/24"} alt="c-author" className="w-5 h-5 rounded-full" />
                  <span className="font-medium">{c.authorName}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{c.body}</p>
              </div>
            ))}
          </div>
          {user ? (
            <div className="flex items-center space-x-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              <button onClick={onComment} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"><Send className="w-4 h-4 mr-1" /> Send</button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Login to comment.</div>
          )}
        </div>
      </div>
    </div>
  );
}


