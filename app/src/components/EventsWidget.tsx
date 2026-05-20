import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EventsWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sakh-card p-4"
    >
      <h3 className="sakh-caption mb-4">
        Афиша
      </h3>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar size={32} className="text-[var(--text-muted)] mb-3" />
        <p className="sakh-meta mb-1">Модуль событий скоро появится</p>
        <p className="sakh-meta text-xs">Следите за обновлениями</p>
      </div>
    </motion.div>
  );
}
