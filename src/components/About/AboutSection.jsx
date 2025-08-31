import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../context/TranslationContext';
import { Card, CardContent } from '../../components/ui/card';
import { Target, Eye, Heart } from 'lucide-react';

const AboutSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Target,
      title: t("Our Purpose"),
      description: t("Make TVET and scholarships accessible to all Nigerians, breaking down barriers to quality education and skill development.")
    },
    {
      icon: Eye,
      title: t("Our Vision"),
      description: t("A Nigeria where every learner has equal access to quality education and opportunities for personal and professional growth.")
    },
    {
      icon: Heart,
      title: t("Our Mission"),
      description: t("Empower learners through innovative digital solutions that connect them with educational opportunities and resources.")
    }
  ];

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-3xl"></div>
      
      <div className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("About AccessEdung")}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t("AccessEdung is a comprehensive educational platform designed to bridge the gap between Nigerian learners and quality education opportunities. We focus on Technical and Vocational Education and Training (TVET) and scholarship access, making education more inclusive and accessible.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {t("Why AccessEdung?")}
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {t("Comprehensive scholarship database with real-time updates")}
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {t("Interactive TVET programs and skill development resources")}
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {t("Multilingual support for inclusive access")}
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {t("Community-driven platform with peer support")}
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-white">🎓</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {t("Join thousands of learners")}
                  </p>
                  <p className="text-gray-600">
                    {t("who have found their path to success")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutSection;

