import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Wrench,
  BookOpen,
  Scissors,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Rocket,
  XCircle
} from "lucide-react";
import {
  getTvetPrograms,
  getTvetScholarships,
  saveProgramForUser,
  removeSavedProgramForUser,
  getUserSavedPrograms
} from "../services/tvetService";

export default function TVET() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedPrograms, setSavedPrograms] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [p, s] = await Promise.all([
          getTvetPrograms(),
          getTvetScholarships()
        ]);
        setPrograms(p);
        setScholarships(s);
        
        // Load user's saved programs if authenticated
        if (user && !user.isAnonymous) {
          try {
            const saved = await getUserSavedPrograms(user.uid);
            setSavedPrograms(saved.map(p => p.id));
          } catch (e) {
            console.error("Error loading saved programs:", e);
          }
        }
      } catch (e) {
        setError("Unable to load TVET content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const iconsByCategory = {
    Engineering: Wrench,
    "Creative Arts": Scissors,
    default: BookOpen
  };

  const hero = (
    <section className="bg-gradient-to-br from-red-50 to-purple-50 border-b border-red-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Empowering Nigeria through TVET
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Technical and Vocational Education and Training prepares youths with practical skills
            for real-world jobs, entrepreneurship, and national development.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                const el = document.getElementById("tvet-programs");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Explore Programs
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center px-4 py-2 ml-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const messageSection = (
    <>
      {/* Success Message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const about = (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{
            title: "Hands-on Skills",
            desc: "Learn by doing with industry-aligned workshops.",
            Icon: Wrench
          }, {
            title: "Accredited Pathways",
            desc: "Programs aligned to Nigerian qualifications.",
            Icon: CheckCircle2
          }, {
            title: "Career Growth",
            desc: "Move into jobs, apprenticeships, or start-ups.",
            Icon: Rocket
          }].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="p-6 bg-gray-50 rounded-xl border border-gray-200"
            >
              <item.Icon className="w-6 h-6 text-red-500" />
              <h3 className="mt-3 font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  const ProgramCard = ({ program }) => {
    const Icon = iconsByCategory[program.category] || iconsByCategory.default;
    const onSave = async () => {
      if (!user || user.isAnonymous) {
        navigate("/");
        return;
      }
      setSaving(true);
      try {
        const result = await saveProgramForUser(user.uid, program);
        if (result.success) {
          setError("");
          setSavedPrograms(prev => [...prev, program.id]);
          setSuccessMessage(`${program.title} saved successfully!`);
          setTimeout(() => {
            setSuccessMessage("");
          }, 3000);
        } else {
          setError(`Failed to save program: ${result.error}`);
        }
      } catch (error) {
        console.error("Error saving program:", error);
        setError("Failed to save program. Please try again.");
      } finally {
        setSaving(false);
      }
    };
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25 }}
        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Icon className="w-6 h-6 text-red-500" />
            <h4 className="font-semibold text-gray-900">{program.title}</h4>
          </div>
          <span className="text-xs text-gray-500 px-2 py-1 rounded-full bg-gray-100">{program.category}</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{program.description}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={onSave}
            disabled={saving || savedPrograms.includes(program.id)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              savedPrograms.includes(program.id)
                ? 'bg-green-500 text-white cursor-not-allowed'
                : saving
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {savedPrograms.includes(program.id) ? (
              <>
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                Saved
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save Program'
            )}
          </button>
          <button
            onClick={() => navigate("/scholarships")}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Details
          </button>
        </div>
      </motion.div>
    );
  };

  const ScholarshipCard = ({ item }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">TVET</span>
        <span className="text-xs text-gray-500 flex items-center"><Users className="w-3 h-3 mr-1" /> {item.slots} slots</span>
      </div>
      <h4 className="font-semibold text-gray-900">{item.title}</h4>
      <p className="text-sm text-gray-600 mt-1 mb-3">{item.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>₦{Number(item.amount || 0).toLocaleString()}</span>
        <span>{new Date(item.deadline).toLocaleDateString()}</span>
      </div>
    </div>
  );

  const SuccessStories = () => {
    const stories = useMemo(() => ([
      {
        id: 1,
        name: "Amina, Kaduna",
        story: "Completed Welding & Fabrication and now runs a small workshop employing 3 apprentices.",
      },
      {
        id: 2,
        name: "Chinedu, Enugu",
        story: "From fashion trainee to launching a bespoke brand serving local schools.",
      },
      {
        id: 3,
        name: "Hassan, Kano",
        story: "Electrical skills led to a stable job with an EPC contractor.",
      },
      {
        id: 4,
        name: "Fatima, Lagos",
        story: "Plumbing certification opened doors to work with major construction companies.",
      },
      {
        id: 5,
        name: "Emeka, Anambra",
        story: "Carpentry training helped me start a furniture business that now exports to neighboring states.",
      },
      {
        id: 6,
        name: "Biodun, Ogun",
        story: "Auto mechanics skills transformed my life - from apprentice to garage owner with 8 employees.",
      },
      {
        id: 7,
        name: "Kemi, Rivers",
        story: "Welding certification led to offshore oil platform work with excellent pay and benefits.",
      },
      {
        id: 8,
        name: "Abdullahi, Kano",
        story: "Electrical installation skills helped me secure government contracts for street lighting projects.",
      },
      {
        id: 9,
        name: "Chioma, Imo",
        story: "Fashion design training enabled me to create jobs for 15 other women in my community.",
      },
      {
        id: 10,
        name: "Tunde, Oyo",
        story: "Masonry skills helped me build a construction company that now handles major projects.",
      }
    ]), []);
    return (
      <div className="space-y-6">
        {/* First row - 5 stories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stories.slice(0, 5).map((s) => (
            <div key={s.id} className="bg-gradient-to-br from-purple-50 to-red-50 border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-700 mt-2">"{s.story}"</p>
              <p className="text-xs text-gray-600 mt-2">— {s.name}</p>
            </div>
          ))}
        </div>
        {/* Second row - 5 stories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stories.slice(5, 10).map((s) => (
            <div key={s.id} className="bg-gradient-to-br from-purple-50 to-red-50 border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-700 mt-2">"{s.story}"</p>
              <p className="text-xs text-gray-600 mt-2">— {s.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {hero}
      {messageSection}
      {about}

      <section id="tvet-programs" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Programs & Skills</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            programs.length === 0 ? (
              <div className="text-center text-gray-600">No programs available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((p) => (
                  <ProgramCard key={p.id} program={p} />
                ))}
              </div>
            )
          )}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Scholarships & Opportunities</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            scholarships.length === 0 ? (
              <div className="text-center text-gray-600">No TVET scholarships available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scholarships.map((s) => (
                  <ScholarshipCard key={s.id} item={s} />
                ))}
              </div>
            )
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Success Stories</h2>
          </div>
          <SuccessStories />
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">Join AccessEdu NG</h3>
              <p className="text-gray-300 mt-2">Create an account to save programs, track scholarships, and more.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}


