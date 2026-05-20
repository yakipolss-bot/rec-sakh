import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function AccountAds() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sakh-card p-8"
    >
      <EmptyState
        title="Объявления"
        description="Функция будет доступна в ближайшее время"
        icon={<FileText size={48} />}
      />
    </motion.div>
  );
}
