import { motion } from "framer-motion";
import teamKhalia from "@/assets/team-khalia.jpg";
import teamRicardo from "@/assets/team-ricardo.jpg";
import teamSteven from "@/assets/team-steven.png";
import teamPablo from "@/assets/team-pablo.jpg";
import teamGary from "@/assets/team-gary.png";


const teamMembers = [
  {
    name: "Khalia Padilla",
    role: "Managing Partner & Founder",
    location: null,
    image: teamKhalia,
  },
  {
    name: "Ricardo Font",
    role: "Managing Partner & Founder",
    location: null,
    image: teamRicardo,
  },
  {
    name: "Steven Lidgreen",
    role: "Managing Partner",
    location: "SFH Tokyo",
    image: teamSteven,
  },
  {
    name: "Pablo Duenas",
    role: "Managing Partner",
    location: "SFH Chile",
    image: teamPablo,
  },
  {
    name: "Gary Jinks",
    role: "Strategic Advisor",
    location: null,
    image: teamGary,
  },
];

const TeamSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ocean-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <span className="text-lg">👥</span>
            <span className="text-sm font-medium text-primary tracking-wider uppercase">Leadership Team</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Meet the{" "}
            <span className="bg-gradient-to-r from-primary via-ocean-primary to-primary bg-clip-text text-transparent">
              Visionaries
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A global team of innovators and industry leaders dedicated to empowering the next generation of deep tech startups.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-2xl tech-card border-0 backdrop-blur-md transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.3)]">
                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-ocean-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Avatar Frame */}
                  <div className="relative mb-6">
                    {/* Outer glow ring */}
                    <div className="absolute inset-[-8px] rounded-full bg-gradient-to-r from-primary/40 via-ocean-primary/40 to-primary/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Avatar container */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-ocean-primary/20 p-[2px] group-hover:from-primary/50 group-hover:to-ocean-primary/50 transition-all duration-500">
                      <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                        {member.image ? (
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold bg-gradient-to-br from-primary to-ocean-primary bg-clip-text text-transparent">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Orbiting particle */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute w-2 h-2 bg-primary rounded-full animate-[spin_3s_linear_infinite]" style={{ top: '0%', left: '50%', transformOrigin: '0 50px' }} />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-ocean-primary transition-all duration-500">
                    {member.name}
                  </h3>

                  {/* Role Badge */}
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
                    <span className="text-sm font-medium text-primary/90">
                      {member.role}
                    </span>
                  </div>

                  {/* Location Tag */}
                  {member.location && (
                    <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <svg className="w-4 h-4 text-ocean-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-ocean-primary font-medium">{member.location}</span>
                    </div>
                  )}
                </div>

                {/* Corner decorations */}
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-ocean-primary/20 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
