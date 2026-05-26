import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const pages: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Пользовательское соглашение',
    content: 'Пользовательское соглашение регулирует отношения между редакцией портала «Сахалин» и пользователями. Используя сайт, вы соглашаетесь с условиями настоящего соглашения. Редакция оставляет за собой право вносить изменения в соглашение без предварительного уведомления.',
  },
  privacy: {
    title: 'Политика конфиденциальности',
    content: 'Настоящая политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей портала «Сахалин». Мы собираем только те данные, которые необходимы для функционирования сайта и предоставления услуг.',
  },
};

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? pages[slug] : null;

  if (!page) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 text-center">
          <h1 className="sakh-heading mb-4">Страница не найдена</h1>
          <Link to="/" className="sakh-link">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]">{page.title}</span>
        </nav>

        <h1 className="sakh-heading mb-4">{page.title}</h1>
        <div className="sakh-card p-6">
          <p className="sakh-body leading-relaxed">{page.content}</p>
        </div>
      </div>
    </div>
  );
}
