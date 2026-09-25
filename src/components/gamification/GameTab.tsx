import React from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Flame, 
  Target, 
  CheckCircle2, 
  Sparkles,
  Lock
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

export const GameTab: React.FC = () => {
  const { users, badges, currentUser, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  // Sort users by points descending
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  const challenges = settings.language === 'en' ? [
    {
      id: 'c1',
      title: 'Green Maintenance Week',
      description: 'Complete replacement or cleaning for at least 2 appliances',
      progress: 1,
      target: 2,
      xp: 100,
      badge: '🛠️'
    },
    {
      id: 'c2',
      title: 'Smart Spending',
      description: 'Log all expenses for 7 out of 7 days this week',
      progress: 5,
      target: 7,
      xp: 75,
      badge: '💰'
    },
    {
      id: 'c3',
      title: 'Family Energy Saver',
      description: 'Keep air conditioner at 26°C with Eco sensors',
      progress: 3,
      target: 3,
      completed: true,
      xp: 50,
      badge: '🌱'
    }
  ] : settings.language === 'ja' ? [
    {
      id: 'c1',
      title: 'グリーンメンテナンス週間',
      description: '少なくとも2台の家電の部品交換または清掃を完了する',
      progress: 1,
      target: 2,
      xp: 100,
      badge: '🛠️'
    },
    {
      id: 'c2',
      title: '計画的な家計管理',
      description: '今週7日連続で支出を記録する',
      progress: 5,
      target: 7,
      xp: 75,
      badge: '💰'
    },
    {
      id: 'c3',
      title: '家庭内省エネマスター',
      description: 'エアコンをEcoモード26°Cに維持する',
      progress: 3,
      target: 3,
      completed: true,
      xp: 50,
      badge: '🌱'
    }
  ] : [
    {
      id: 'c1',
      title: 'Tuần lễ bảo dưỡng xanh',
      description: 'Hoàn thành việc thay thế linh kiện hoặc vệ sinh ít nhất 2 thiết bị',
      progress: 1,
      target: 2,
      xp: 100,
      badge: '🛠️'
    },
    {
      id: 'c2',
      title: 'Chi tiêu khoa học',
      description: 'Ghi chép chi tiêu đầy đủ 7/7 ngày trong tuần',
      progress: 5,
      target: 7,
      xp: 75,
      badge: '💰'
    },
    {
      id: 'c3',
      title: 'Tiết kiệm năng lượng gia đình',
      description: 'Duy trì các thiết bị điều hòa ở mức 26°C với cảm biến Eco',
      progress: 3,
      target: 3,
      completed: true,
      xp: 50,
      badge: '🌱'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Trophy size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('game_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('game_subtitle')}
          </p>
        </div>
      </div>

      {/* Leaderboard Podiums Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 rounded-3xl p-5 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-amber-100 uppercase tracking-wider flex items-center gap-1.5">
            <Flame size={16} className="animate-bounce" />
            <span>{t('game_leaderboard')}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {settings.language === 'en' ? 'Sep 2026' : settings.language === 'ja' ? '2026年9月' : 'Tháng 9/2026'}
          </span>
        </div>

        {/* Top 3 Podiums */}
        <div className="flex items-end justify-center gap-2 pt-2 pb-1">
          {/* Rank 2 */}
          {sortedUsers[1] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">{sortedUsers[1].avatar}</span>
              <div className="text-[11px] font-bold truncate max-w-[80px] text-center">
                {sortedUsers[1].name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-amber-200 font-semibold">
                {sortedUsers[1].points} XP
              </div>
              <div className="w-full h-16 bg-white/20 rounded-t-2xl mt-1.5 flex items-center justify-center font-black text-lg text-amber-200">
                🥈 2
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {sortedUsers[0] && (
            <div className="flex-1 flex flex-col items-center -mt-4">
              <span className="text-3xl mb-1 drop-shadow-md">{sortedUsers[0].avatar}</span>
              <div className="text-xs font-black truncate max-w-[90px] text-center text-amber-100">
                {sortedUsers[0].name.split(' ')[0]}
              </div>
              <div className="text-xs text-white font-extrabold">
                {sortedUsers[0].points} XP
              </div>
              <div className="w-full h-24 bg-white/30 rounded-t-2xl mt-1.5 flex items-center justify-center font-black text-2xl text-amber-100 shadow-inner">
                👑 1
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {sortedUsers[2] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">{sortedUsers[2].avatar}</span>
              <div className="text-[11px] font-bold truncate max-w-[80px] text-center">
                {sortedUsers[2].name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-amber-200 font-semibold">
                {sortedUsers[2].points} XP
              </div>
              <div className="w-full h-12 bg-white/15 rounded-t-2xl mt-1.5 flex items-center justify-center font-black text-base text-amber-200">
                🥉 3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Challenges */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Target size={15} className="text-indigo-600" />
            <span>{t('game_weekly_challenge')}</span>
          </h2>
          <span className="text-[11px] text-indigo-600 font-bold">{t('game_refresh_in')}</span>
        </div>

        <div className="space-y-2">
          {challenges.map(c => {
            const isDone = c.completed || c.progress >= c.target;
            const pct = Math.round((c.progress / c.target) * 100);

            return (
              <div
                key={c.id}
                className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{c.badge}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.description}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    +{c.xp} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>{t('game_progress')}: {c.progress}/{c.target}</span>
                    <span className={isDone ? 'text-emerald-600 font-bold' : ''}>
                      {isDone ? t('game_completed') : `${pct}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Collection */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Award size={15} className="text-amber-600" />
          <span>{t('game_badges')} ({badges.filter(b => b.unlocked).length}/{badges.length})</span>
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {badges.map(b => (
            <div
              key={b.id}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                b.unlocked
                  ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/60 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="relative">
                <span className="text-3xl">{b.icon}</span>
                {!b.unlocked && (
                  <div className="absolute -bottom-1 -right-1 bg-slate-700 text-white rounded-full p-1">
                    <Lock size={10} />
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                {b.title}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium mt-0.5 line-clamp-2 leading-tight">
                {b.description}
              </div>
              {b.unlocked && b.unlockedAt && (
                <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  {t('game_unlocked_at', { time: b.unlockedAt })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
