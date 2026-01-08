import { motion } from "framer-motion";
import { DollarSign, Calendar, FileCheck, Clock, RefreshCw, Zap } from "lucide-react";

const paymentDetails = [
  { icon: DollarSign, label: "Total Fee", value: "USD $350,000", description: "Complete Phase 1 investment" },
  { icon: FileCheck, label: "Payment Structure", value: "One-Time Upfront", description: "Single payment upon contract" },
  { icon: Calendar, label: "Contract Term", value: "12 Months", description: "From effective date" },
  { icon: Clock, label: "Payment Timing", value: "Upon Execution", description: "Due at contract signing" },
  { icon: RefreshCw, label: "Renewal", value: "Mutual Agreement", description: "Subject to review" },
];

const PaymentTerms = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">INVESTMENT TERMS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Payment <span className="text-primary">Terms</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Phase 1 investment structure and payment details
          </p>
        </motion.div>

        {/* Main Investment Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="relative group">
            {/* Animated glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-teal-400 to-primary rounded-3xl opacity-30 blur-xl group-hover:opacity-50 transition-all duration-500 animate-pulse" />
            
            <div className="relative p-8 md:p-12 rounded-3xl bg-card/90 backdrop-blur-xl border border-primary/30">
              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/50 rounded-tl-xl" />
              <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/50 rounded-tr-xl" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/50 rounded-bl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/50 rounded-br-xl" />

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-400 mb-4">
                  <Zap className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Phase 1 Investment</h3>
                <p className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-teal-400 to-primary bg-clip-text text-transparent">
                  $350,000
                </p>
                <p className="text-lg text-muted-foreground mt-2">USD • One-Time Payment</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {paymentDetails.map((detail, index) => (
                  <motion.div
                    key={detail.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center"
                  >
                    <detail.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{detail.label}</p>
                    <p className="font-bold text-foreground">{detail.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{detail.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purpose Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border">
            <h4 className="text-lg font-bold text-foreground mb-3">Investment Purpose</h4>
            <p className="text-muted-foreground leading-relaxed">
              The investment covers <span className="text-primary font-semibold">initiation and execution</span> of the Japan accelerator program, including platform access, dedicated team, startup sourcing, program management, coworking facilities, events, mentor network access, and comprehensive reporting.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PaymentTerms;
