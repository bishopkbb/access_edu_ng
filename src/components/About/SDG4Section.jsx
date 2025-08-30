import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTranslation } from '../../context/TranslationContext';
import { Card, CardContent } from '../../components/ui/card';
import { GraduationCap, Users, Globe, Target } from 'lucide-react';
import { Link } from 'react-router-dom';  

const AnimatedCounter = ({ value, duration = 2 }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, count, duration]);

  return <motion.span>{rounded}</motion.span>;
};

const SDG4Section = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const stats = [
    {
      icon: Users,
      value: 500,
      suffix: "+",
      label: t("Learners Reached"),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: GraduationCap,
      value: 50,
      suffix: "+",
      label: t("Scholarships Listed"),
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Globe,
      value: 36,
      suffix: "",
      label: t("States Covered"),
      color: "from-green-500 to-green-600"
    },
    {
      icon: Target,
      value: 95,
      suffix: "%",
      label: t("Success Rate"),
      color: "from-red-500 to-red-600"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('sdg4-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <div id="sdg4-section" className="relative">
      {/* ✅ Back to Dashboard Button at Top */}
      <div className="text-left mb-6">
        <Link
          to="/dashboard"
          className="inline-block bg-gray-800 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-700 transition-colors"
        >
          ← {t("Back to Dashboard")}
        </Link>
      </div>

      {/* SDG4 Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-3xl"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-6"
          >
            <span className="text-3xl">🎯</span>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("Sustainable Development Goal 4")}
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            {t("Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all")}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {t("How AccessEdung Aligns with SDG4")}
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t("Inclusive Access")}
                      </h4>
                      <p className="text-gray-600">
                        {t("We provide equal access to educational resources regardless of location, economic status, or background.")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t("Quality Education")}
                      </h4>
                      <p className="text-gray-600">
                        {t("Curated scholarship opportunities and TVET programs that meet international quality standards.")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t("Lifelong Learning")}
                      </h4>
                      <p className="text-gray-600">
                        {t("Continuous skill development through our community forum and interactive learning resources.")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-center text-white">
                <div className="text-6xl mb-2">🎓</div>
                <div className="text-lg font-semibold">SDG 4</div>
                <div className="text-sm opacity-90">Quality Education</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {isVisible ? (
                      <>
                        <AnimatedCounter value={stat.value} />
                        {stat.suffix}
                      </>
                    ) : (
                      "0"
                    )}
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Card className="border-0 bg-gradient-to-r from-green-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                {t("Join us in bridging the education gap in Nigeria")}
              </h3>
              <p className="text-lg opacity-90 mb-6">
                {t("Together, we can create a more inclusive and equitable education system for all Nigerians.")}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                {t("Get Started Today")}
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SDG4Section;
