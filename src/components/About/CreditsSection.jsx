import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../context/TranslationContext';
import { Card, CardContent } from '../ui/card';
import { Github, Linkedin, Globe, Heart } from 'lucide-react';

const CreditsSection = () => {
  const { t } = useTranslation();

  const contributors = [
    {
      name: "AccessEdung Team",
      role: t("Core Development"),
      avatar: "👨‍💻",
      github: "https://github.com/bishopkbb",
      linkedin: "https://linkedin.com/in/ajibade-tosin-955252361",
      description: t("Main development team behind AccessEdung platform")
    },
    {
      name: "Nigerian Education Partners",
      role: t("Educational Content"),
      avatar: "🎓",
      github: null,
      linkedin: null,
      description: t("Educational institutions providing TVET programs and guidance")
    },
    {
      name: "Open Source Community",
      role: t("Technology Stack"),
      avatar: "🌐",
      github: "https://github.com",
      linkedin: null,
      description: t("Open source libraries and frameworks that power our platform")
    }
  ];

  const partners = [
    {
      name: "Federal Ministry of Education",
      logo: "🏛️",
      description: t("Government support and policy alignment")
    },
    {
      name: "Nigerian Universities Commission",
      logo: "🎓",
      description: t("Quality assurance and accreditation support")
    },
    {
      name: "Technical Education Board",
      logo: "🔧",
      description: t("TVET program standards and certification")
    }
  ];

  const technologies = [
    {
      name: "React",
      logo: "⚛️",
      description: t("Frontend framework")
    },
    {
      name: "Firebase",
      logo: "🔥",
      description: t("Backend and database")
    },
    {
      name: "Tailwind CSS",
      logo: "🎨",
      description: t("Styling framework")
    },
    {
      name: "Framer Motion",
      logo: "✨",
      description: t("Animation library")
    }
  ];

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-3xl"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6"
          >
            <Heart className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("Credits & Acknowledgments")}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t("We acknowledge the contributions of our partners, team members, and the open source community that made AccessEdung possible.")}
          </p>
        </div>

        {/* Contributors */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t("Our Team & Contributors")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contributors.map((contributor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                      {contributor.avatar}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {contributor.name}
                    </h4>
                    <p className="text-purple-600 font-medium mb-3">
                      {contributor.role}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      {contributor.description}
                    </p>
                    <div className="flex justify-center space-x-3">
                      {contributor.github && (
                        <motion.a
                          href={contributor.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                        >
                          <Github className="w-5 h-5" />
                        </motion.a>
                      )}
                      {contributor.linkedin && (
                        <motion.a
                          href={contributor.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </motion.a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t("Partner Organizations")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      {partner.logo}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {partner.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {partner.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technologies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t("Technologies & Libraries")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                      {tech.logo}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {tech.name}
                    </h4>
                    <p className="text-gray-600 text-xs">
                      {tech.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Card className="border-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-bold">
                  {t("Made with love for Nigerian learners")}
                </h3>
              </div>
              <p className="text-lg opacity-90">
                {t("Thank you to everyone who contributed to making education more accessible in Nigeria.")}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreditsSection;
