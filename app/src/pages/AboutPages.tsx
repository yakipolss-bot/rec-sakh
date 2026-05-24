import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, Mail, Users, Briefcase, FileText, Shield, Cookie } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

type AboutTab = 'about' | 'advertising' | 'contacts' | 'vacancies' | 'agreement' | 'privacy' | 'cookies';

const TABS: { value: AboutTab; label: string; icon: React.ReactNode }[] = [
  { value: 'about', label: 'О проекте', icon: <Info size={14} /> },
  { value: 'advertising', label: 'Реклама', icon: <Mail size={14} /> },
  { value: 'contacts', label: 'Контакты', icon: <Users size={14} /> },
  { value: 'vacancies', label: 'Вакансии', icon: <Briefcase size={14} /> },
  { value: 'agreement', label: 'Соглашение', icon: <FileText size={14} /> },
  { value: 'privacy', label: 'Приватность', icon: <Shield size={14} /> },
  { value: 'cookies', label: 'Cookies', icon: <Cookie size={14} /> },
];

const content: Record<AboutTab, { title: string; body: string[] }> = {
  about: {
    title: 'О проекте',
    body: [
      'Sakhcom — информационный портал Сахалина. Мы освещаем самые важные события региона: от политики и экономики до культуры и спорта.',
      'Наша миссия — предоставлять жителям и гостям острова актуальную, проверенную и полезную информацию. Мы работаем для вас 24/7.',
      'Редакция портала состоит из профессиональных журналистов, фотографов и редакторов, которые ежедневно готовят для вас свежие материалы.',
      'Портал основан в 2020 году. За это время мы стали одним из самых посещаемых информационных ресурсов Сахалинской области.',
    ],
  },
  advertising: {
    title: 'Реклама на портале',
    body: [
      'Размещение рекламы на Sakhcom — эффективный способ привлечь внимание аудитории Сахалина и Дальнего Востока.',
      'Мы предлагаем различные форматы: баннеры, нативные статьи, спецпроекты, видеорекламу.',
      'Наша аудитория — более 100 000 уникальных посетителей в месяц. Жители Сахалина, активные, платежеспособные, интересующиеся жизнью региона.',
      'По вопросам размещения рекламы обращайтесь по адресу: advertising@rec-sakh.ru или по телефону: +7 (4242) 00-00-00.',
    ],
  },
  contacts: {
    title: 'Контакты редакции',
    body: [
      'Адрес: 693000, г. Южно-Сахалинск, ул. Ленина, д. 1, офис 100',
      'Телефон редакции: +7 (4242) 00-00-01',
      'Email: news@rec-sakh.ru',
      'По техническим вопросам: support@rec-sakh.ru',
      'Режим работы: круглосуточно (новости публикуются 24/7). Административные вопросы: пн-пт, 09:00–18:00.',
    ],
  },
  vacancies: {
    title: 'Вакансии редакции',
    body: [
      'Мы постоянно ищем талантливых журналистов, фотографов, видеооператоров и редакторов.',
      'На данный момент открыты вакансии:',
      '• Журналист (опыт от 1 года, знание региона приветствуется)',
      '• Фотокорреспондент (портфолио обязательно)',
      '• Редактор социальных сетей (SMM-менеджер)',
      '• Разработчик (React/TypeScript)',
      'Резюме направляйте на hr@rec-sakh.ru с пометкой «Вакансия: [название]».',
    ],
  },
  agreement: {
    title: 'Пользовательское соглашение',
    body: [
      'Используя портал Sakhcom, вы соглашаетесь с настоящим пользовательским соглашением.',
      'Все материалы, опубликованные на портале, защищены авторским правом. Копирование и использование материалов без письменного согласия редакции запрещено.',
      'Пользователь несёт ответственность за достоверность информации, размещаемой в комментариях и объявлениях.',
      'Редакция оставляет за собой право удалять любые материалы и комментарии, нарушающие законодательство РФ или правила портала.',
      'Администрация портала не несёт ответственности за содержание рекламных материалов и внешних ссылок.',
    ],
  },
  privacy: {
    title: 'Политика конфиденциальности',
    body: [
      'Настоящая политика конфиденциальности регулирует порядок обработки и использования персональных данных пользователей портала Sakhcom.',
      'Мы собираем только те данные, которые необходимы для работы портала: имя, email, дата регистрации.',
      'Ваши данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством РФ.',
      'Вы можете в любой момент удалить свой аккаунт и все связанные с ним данные, обратившись в службу поддержки.',
      'Мы используем шифрование для защиты ваших данных при передаче.',
    ],
  },
  cookies: {
    title: 'Политика использования Cookie',
    body: [
      'Портал Sakhcom использует файлы cookie для обеспечения работы сайта и сбора статистики посещений.',
      'Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта.',
      'Мы используем следующие типы cookie:',
      '• Технические (необходимые для работы сайта)',
      '• Аналитические (Яндекс.Метрика)',
      '• Функциональные (сохранение настроек)',
      'Вы можете отключить cookie в настройках браузера. Однако это может повлиять на работу некоторых функций портала.',
      'Продолжая использование сайта, вы соглашаетесь с использованием cookie.',
    ],
  },
};

export default function AboutPages() {
  const [tab, setTab] = useState<AboutTab>('about');
  const current = content[tab];

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="О проекте | Сахалин" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">О проекте</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">О портале Sakhcom</h1>
        </motion.div>

        <div className="sakh-tabs mb-6">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`sakh-tabs__item ${tab === t.value ? 'sakh-tabs__item--active' : ''}`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="sakh-card p-6 max-w-[720px]"
          >
            <h2 className="sakh-heading mb-4">{current.title}</h2>
            <div className="space-y-4">
              {current.body.map((paragraph, i) => (
                <p key={i} className="sakh-body leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
