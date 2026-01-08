import { motion } from "framer-motion";
import { Video, Users, Mic, Trophy, Calendar } from "lucide-react";

const events = [
  { icon: Video, type: "Online Sessions", frequency: "Weekly", annual: "50", color: "from-blue-500 to-cyan-500" },
  { icon: Users, type: "In-Person Events", frequency: "2/month", annual: "12", color: "from-purple-500 to-pink-500" },
  { icon: Mic, type: "Pitch Days", frequency: "2/month", annual: "24", color: "from-orange-500 to-red-500" },
  { icon: Trophy, type: "Demo Days", frequency: "2/year", annual: "2", color: "from-primary to-teal-400" },
];

const EventsCalendar = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Events <span className="text-primary">Calendar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            100+ annual events designed for startup success
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {events.map((event, index) => (
              <motion.div
                key={event.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                {/* Glow */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${event.color} rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity`} />
                
                <div className="relative p-6 rounded-2xl bg-card border border-border flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center flex-shrink-0`}>
                    <event.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">{event.type}</h3>
                    <p className="text-sm text-muted-foreground">{event.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary font-mono">{event.annual}</p>
                    <p className="text-xs text-muted-foreground">per year</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-400 rounded-2xl opacity-20 blur-lg" />
            <div className="relative p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="w-10 h-10 text-primary" />
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Total Annual Events</h3>
                  <p className="text-muted-foreground">Comprehensive event programming</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-primary font-mono">100+</p>
                <p className="text-sm text-muted-foreground">events</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EventsCalendar;
