import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Target, Heart, Zap, ArrowRight, Linkedin, Mail, Award, TrendingUp, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function monthsAtLifeQuest(startDate) {
  const now = new Date();
  const start = new Date(startDate);
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe that lasting change happens when people support each other. Our platform puts community at the heart of personal growth."
    },
    {
      icon: Target,
      title: "Holistic Approach",
      description: "True life transformation requires addressing all aspects of well-being - habits, health, finances, and mindset together."
    },
    {
      icon: Heart,
      title: "Accessible to All",
      description: "Personal growth shouldn't be a privilege. We're committed to making self-improvement tools accessible to everyone."
    },
    {
      icon: Zap,
      title: "Science-Based",
      description: "Our features are built on proven psychological principles and behavioral science to ensure real, lasting results."
    }
  ];

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase.from('team').select('*');
      setTeamMembers(data || []);
    };
    fetchTeam();
  }, []);

  const milestones = [
    {
      year: "2024",
      title: "LifeQuest Launched",
      description: "Officially launched with core habit tracking and community features"
    },
    {
      year: "2024",
      title: "10K+ Users",
      description: "Reached our first major milestone of 10,000 active users"
    },
    {
      year: "2024",
      title: "Premium Features",
      description: "Introduced advanced analytics and AI-powered recommendations"
    },
    {
      year: "Future",
      title: "Global Expansion",
      description: "Planning to expand internationally and support multiple languages"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200">
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Building the Future of
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Personal Growth
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We believe everyone deserves the tools and community support to become their best self. 
            That's why we created LifeQuest - a gamified platform that makes personal growth engaging, 
            social, and sustainable.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We're on a mission to democratize personal development by combining the power of 
                community, gamification, and technology. Traditional self-help often falls short 
                because it lacks engagement and accountability.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                LifeQuest solves this by creating an ecosystem where personal growth becomes a 
                shared adventure. We turn the lonely journey of self-improvement into a social, 
                fun, and rewarding experience.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">10K+</div>
                  <div className="text-sm text-gray-600">Lives Transformed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">500K+</div>
                  <div className="text-sm text-gray-600">Goals Achieved</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-8 border border-indigo-200">
              <div className="aspect-square bg-white rounded-xl shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-full mb-4 inline-block">
                    <Globe className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Global Impact</h3>
                  <p className="text-gray-600">Empowering users worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything we do is guided by our core values that put users and community first.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card key={index} className="border-0 shadow-lg text-center">
                  <CardHeader>
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-full w-fit mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're a passionate team of builders, designers, and behavioral scientists united by 
              our mission to help people live their best lives.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-indigo-600 font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {member.description}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <a 
                      href={member.linkedin} 
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a 
                      href={`mailto:${member.email}`} 
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                  <div>{monthsAtLifeQuest(member.start_date)} months at LifeQuest</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              From idea to impact - here's how we're building the future of personal growth.
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                      {milestone.year}
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Be part of a community that's redefining what personal growth looks like. 
            Your journey to becoming your best self starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 text-lg px-8 py-3">
                Start Your Quest Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-3">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">LifeQuest</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering individuals to transform their lives through gamified self-improvement 
                and community support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:anmol.jain@berkeley.edu" className="hover:text-white transition-colors">anmol.jain@berkeley.edu</a></li>
                <li><a href="https://www.linkedin.com/in/anmol-jain-7b2b3b1b4/" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LifeQuest. All rights reserved. Built with ❤️ for personal growth.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
