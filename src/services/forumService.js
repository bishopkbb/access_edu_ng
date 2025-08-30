import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const POSTS = "forum_posts";
const COMMENTS = "forum_comments";

export const FORUM_CATEGORIES = [
  { id: "tvet", name: "TVET Programs" },
  { id: "scholarships", name: "Scholarships" },
  { id: "career", name: "Career Advice" },
  { id: "general", name: "General Discussion" },
];

export async function createPost({ title, body, categoryId, imageUrl = "", author }) {
  const ref = collection(db, POSTS);
  const payload = {
    title: title?.trim() || "Untitled",
    body: body || "",
    categoryId: categoryId || "general",
    imageUrl, // single image URL (optional)
    attachments: [], // [{type:'image'|'video'|'file', url:string, name?:string}]
    authorId: author?.uid || "",
    authorName: author?.displayName || author?.email || "Anonymous",
    authorPhoto: author?.photoURL || "",
    likes: [],
    bookmarks: [],
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

export async function getPost(postId) {
  const snap = await getDoc(doc(db, POSTS, postId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listPosts({ categoryId = "all", sort = "recent", search = "" } = {}) {
  let qRef = collection(db, POSTS);
  if (categoryId !== "all") {
    qRef = query(qRef, where("categoryId", "==", categoryId));
  }
  if (sort === "recent") {
    qRef = query(qRef, orderBy("createdAt", "desc"), limit(50));
  } else if (sort === "popular") {
    qRef = query(qRef, orderBy("commentsCount", "desc"), limit(50));
  }
  const snap = await getDocs(qRef);
  let items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  if (items.length === 0) {
    items = getMockPosts();
  }
  if (search) {
    const term = search.toLowerCase();
    items = items.filter((p) =>
      p.title?.toLowerCase().includes(term) || p.body?.toLowerCase().includes(term)
    );
  }
  return items;
}

export async function toggleLike(postId, userId) {
  const ref = doc(db, POSTS, postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const likes = Array.isArray(data.likes) ? data.likes : [];
  const has = likes.includes(userId);
  const next = has ? likes.filter((id) => id !== userId) : [...likes, userId];
  await updateDoc(ref, { likes: next, updatedAt: serverTimestamp() });
}

export async function toggleBookmark(postId, userId) {
  const ref = doc(db, POSTS, postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  const has = bookmarks.includes(userId);
  const next = has ? bookmarks.filter((id) => id !== userId) : [...bookmarks, userId];
  await updateDoc(ref, { bookmarks: next, updatedAt: serverTimestamp() });
}

export async function addComment({ postId, body, author, parentId = null }) {
  const commentsRef = collection(db, COMMENTS);
  const newComment = {
    postId,
    parentId, // for threaded replies
    body: body || "",
    authorId: author?.uid || "",
    authorName: author?.displayName || author?.email || "Anonymous",
    authorPhoto: author?.photoURL || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await addDoc(commentsRef, newComment);
  // update count
  const postRef = doc(db, POSTS, postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const count = Number(postSnap.data().commentsCount || 0) + 1;
    await updateDoc(postRef, { commentsCount: count });
  }
}

export async function listComments(postId) {
  const ref = collection(db, COMMENTS);
  const qRef = query(ref, where("postId", "==", postId), orderBy("createdAt", "asc"));
  const snap = await getDocs(qRef);
  const items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items;
}

// Mock posts fallback for development/demo
function getMockPosts() {
  const now = new Date();
  return [
    {
      id: "mock-1",
      title: "Best TVET starter kits for Welding?",
      body: "What tools should I prioritize on a small budget in Nigeria?",
      categoryId: "tvet",
      authorName: "Amina",
      authorPhoto: "",
      likes: ["u1", "u2"],
      bookmarks: [],
      commentsCount: 3,
      createdAt: { toDate: () => now },
      attachments: [{ type: 'image', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12', name: 'welding.jpg' }]
    },
    {
      id: "mock-2",
      title: "New scholarship for TVET learners",
      body: "Saw a fund supporting apprentices, sharing here for others.",
      categoryId: "scholarships",
      authorName: "Chinedu",
      authorPhoto: "",
      likes: ["u2"],
      bookmarks: ["u3"],
      commentsCount: 1,
      createdAt: { toDate: () => new Date(now.getTime() - 3600*1000) },
      attachments: [{ type: 'file', url: 'https://example.com/tvet-fund.pdf', name: 'TVET-Fund.pdf' }]
    },
    {
      id: "mock-3",
      title: "From trainee to startup owner",
      body: "Short video about my journey through Fashion Design program.",
      categoryId: "career",
      authorName: "Hassan",
      authorPhoto: "",
      likes: [],
      bookmarks: [],
      commentsCount: 0,
      createdAt: { toDate: () => new Date(now.getTime() - 2*3600*1000) },
      attachments: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', name: 'journey.mp4' }]
    }
  ];
}


