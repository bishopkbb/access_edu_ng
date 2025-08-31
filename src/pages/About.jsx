import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';
import AboutSection from '../components/About/AboutSection';
import SDG4Section from '../components/About/SDG4Section';
import CreditsSection from '../components/About/CreditsSection';

const About = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("About AccessEdung")}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("Empowering Nigerian learners through accessible TVET and scholarship opportunities")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* About Section */}
        <motion.div variants={sectionVariants} className="mb-16">
          <AboutSection />
        </motion.div>

        {/* SDG4 Section */}
        <motion.div variants={sectionVariants} className="mb-16">
          <SDG4Section />
        </motion.div>

        {/* Credits Section */}
        <motion.div variants={sectionVariants}>
          <CreditsSection />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About;

