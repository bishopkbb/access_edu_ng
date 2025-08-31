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
      body: "What tools should I prioritize on a small budget in Nigeria? Looking for recommendations from experienced welders.",
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
      body: "Saw a fund supporting apprentices, sharing here for others. Deadline is next month!",
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
      body: "Short video about my journey through Fashion Design program. Started with ₦50k, now making ₦500k monthly!",
      categoryId: "career",
      authorName: "Hassan",
      authorPhoto: "",
      likes: ["u4", "u5", "u6"],
      bookmarks: ["u7"],
      commentsCount: 5,
      createdAt: { toDate: () => new Date(now.getTime() - 2*3600*1000) },
      attachments: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', name: 'journey.mp4' }]
    },
    {
      id: "mock-4",
      title: "Electrical Installation Course Review",
      body: "Just completed my electrical installation course at Lagos Technical College. Here's my honest review and tips for beginners.",
      categoryId: "tvet",
      authorName: "Fatima",
      authorPhoto: "",
      likes: ["u8", "u9"],
      bookmarks: ["u10"],
      commentsCount: 2,
      createdAt: { toDate: () => new Date(now.getTime() - 3*3600*1000) }
    },
    {
      id: "mock-5",
      title: "Government TVET Funding Opportunities",
      body: "The federal government just announced new funding for TVET programs. Check if you're eligible!",
      categoryId: "scholarships",
      authorName: "Oluwaseun",
      authorPhoto: "",
      likes: ["u11", "u12", "u13"],
      bookmarks: ["u14", "u15"],
      commentsCount: 8,
      createdAt: { toDate: () => new Date(now.getTime() - 4*3600*1000) }
    },
    {
      id: "mock-6",
      title: "How to start a small carpentry business",
      body: "After completing my carpentry training, I started with basic tools. Here's my step-by-step guide to building a successful business.",
      categoryId: "career",
      authorName: "Emeka",
      authorPhoto: "",
      likes: ["u16", "u17", "u18"],
      bookmarks: ["u19", "u20"],
      commentsCount: 12,
      createdAt: { toDate: () => new Date(now.getTime() - 5*3600*1000) },
      attachments: [{ type: 'image', url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122', name: 'carpentry.jpg' }]
    },
    {
      id: "mock-7",
      title: "Plumbing apprenticeship opportunities in Abuja",
      body: "Looking for plumbing apprentices in Abuja area. Good pay and training provided. DM for details.",
      categoryId: "tvet",
      authorName: "Abdullahi",
      authorPhoto: "",
      likes: ["u21"],
      bookmarks: ["u22", "u23"],
      commentsCount: 4,
      createdAt: { toDate: () => new Date(now.getTime() - 6*3600*1000) }
    },
    {
      id: "mock-8",
      title: "International TVET exchange program",
      body: "Germany is offering exchange programs for Nigerian TVET students. Applications open now!",
      categoryId: "scholarships",
      authorName: "Chioma",
      authorPhoto: "",
      likes: ["u24", "u25", "u26", "u27"],
      bookmarks: ["u28", "u29", "u30"],
      commentsCount: 15,
      createdAt: { toDate: () => new Date(now.getTime() - 7*3600*1000) }
    },
    {
      id: "mock-9",
      title: "Success story: From mechanic to garage owner",
      body: "Started as a mechanic apprentice 5 years ago. Now I own a garage with 8 employees. Hard work pays off!",
      categoryId: "career",
      authorName: "Biodun",
      authorPhoto: "",
      likes: ["u31", "u32", "u33", "u34"],
      bookmarks: ["u35", "u36"],
      commentsCount: 7,
      createdAt: { toDate: () => new Date(now.getTime() - 8*3600*1000) },
      attachments: [{ type: 'image', url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d', name: 'garage.jpg' }]
    },
    {
      id: "mock-10",
      title: "Best practices for welding safety",
      body: "Safety first! Here are the essential safety practices every welder should know. Share your own tips too.",
      categoryId: "tvet",
      authorName: "Kemi",
      authorPhoto: "",
      likes: ["u37", "u38", "u39"],
      bookmarks: ["u40", "u41", "u42"],
      commentsCount: 6,
      createdAt: { toDate: () => new Date(now.getTime() - 9*3600*1000) }
    },
    {
      id: "mock-11",
      title: "Free online TVET courses available",
      body: "Found some great free online courses for TVET skills. Perfect for those who can't afford physical training.",
      categoryId: "general",
      authorName: "Tunde",
      authorPhoto: "",
      likes: ["u43", "u44", "u45", "u46"],
      bookmarks: ["u47", "u48", "u49"],
      commentsCount: 9,
      createdAt: { toDate: () => new Date(now.getTime() - 10*3600*1000) }
    },
    {
      id: "mock-12",
      title: "How to market your TVET skills",
      body: "Marketing tips for TVET graduates. How to find clients and build your reputation in the industry.",
      categoryId: "career",
      authorName: "Aisha",
      authorPhoto: "",
      likes: ["u50", "u51"],
      bookmarks: ["u52", "u53", "u54"],
      commentsCount: 3,
      createdAt: { toDate: () => new Date(now.getTime() - 11*3600*1000) }
    }
  ];
}


