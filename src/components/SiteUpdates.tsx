import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import entries from '@/data/site-updates.json';

type SiteUpdate = {
  at: string;
  zh: string;
  en: string;
  href?: string;
};

const recent: SiteUpdate[] = [...entries]
  .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  .slice(0, 5);

const berlinTime = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Berlin',
});

const focus = 'rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';

function UpdateTime({ at, language }: { at: string; language: 'zh' | 'en' }) {
  return <time dateTime={at} title={language === 'en' ? 'Berlin time' : '柏林时间'}
    className="whitespace-nowrap text-xs tabular-nums text-foreground/65">
    {berlinTime.format(new Date(at))}
  </time>;
}

function UpdateSummary({ update, language }: { update: SiteUpdate; language: 'zh' | 'en' }) {
  return update.href
    ? <a href={update.href} className={focus + ' underline decoration-primary/40 underline-offset-4 hover:decoration-primary'}>
      {update[language]}
    </a>
    : update[language];
}

export default function SiteUpdates() {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [latest, ...previous] = recent;
  if (!latest) return null;

  const en = language === 'en';
  return (
    <section aria-labelledby="site-updates-title" className="bg-[#0d1014] pt-3">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-[1200px] rounded-lg border border-border bg-card/60 text-sm min-[760px]:w-[calc(100%-3rem)]">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 px-3 py-1.5 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:gap-x-4 sm:px-4">
          <h2 id="site-updates-title" className="col-span-2 flex items-center gap-2 whitespace-nowrap font-semibold text-primary sm:col-span-1">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
            {en ? 'Recent updates' : '最近更新'}
          </h2>
          <div className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
            <UpdateTime at={latest.at} language={language} />
          </div>
          <div className="col-span-2 col-start-2 row-start-2 py-1 leading-snug sm:col-span-1 sm:col-start-3 sm:row-start-1">
            <UpdateSummary update={latest} language={language} />
          </div>
          {previous.length > 0 && <button type="button" aria-expanded={expanded} aria-controls="site-updates-history"
            onClick={() => setExpanded(!expanded)}
            className={focus + ' col-start-3 row-start-1 inline-flex min-h-8 items-center gap-1 justify-self-end whitespace-nowrap text-xs text-foreground/70 hover:text-foreground sm:col-start-4'}>
            {expanded ? (en ? 'Show less' : '收起') : (en ? 'More' : '更多')}
            <ChevronDown aria-hidden="true" className={expanded ? 'h-3.5 w-3.5 rotate-180' : 'h-3.5 w-3.5'} />
          </button>}
        </div>
        <ol id="site-updates-history" hidden={!expanded} className="divide-y divide-border border-t border-border px-3 sm:px-4">
          {previous.map(update => <li key={update.at} className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 py-2.5 leading-snug sm:gap-x-4">
            <UpdateTime at={update.at} language={language} />
            <div><UpdateSummary update={update} language={language} /></div>
          </li>)}
        </ol>
      </div>
    </section>
  );
}
