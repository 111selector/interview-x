import React from 'react';
import { Screen, User, Plan } from '../types';
import { CheckIcon } from './icons';

interface PlansScreenProps {
  user: User | null;
  onNavigate: (screen: Screen, data?: any) => void;
  t: (key: string) => string;
}

const plansData = [
    {
        name: Plan.FREE,
        price: '$0',
        features: ['1 basic interview/month', 'Limited feedback', 'No downloads'],
        recommended: false,
    },
    {
        name: Plan.STANDARD,
        price: '$9',
        priceTerm: '/ month',
        features: ['3 interviews/month', 'Full feedback report', '2 PDF downloads/month'],
        recommended: false,
    },
    {
        name: Plan.PRO,
        price: '$15',
        priceTerm: '/ month',
        features: ['10 interviews/month', 'Intermediate & Advanced roles', '6 PDF & JSON downloads/month'],
        recommended: true,
    },
    {
        name: Plan.PREMIUM,
        price: '$30',
        priceTerm: '/ month',
        features: ['Unlimited interviews', 'Premium roles (FAANG, Finance)', '20 downloads with Commercial License'],
        recommended: false,
    },
];

const PlanCard: React.FC<{ plan: typeof plansData[0], isCurrent: boolean, onSelect: () => void, t: (key: string) => string }> = ({ plan, isCurrent, onSelect, t }) => {
    const isRecommended = plan.recommended;
    const baseBorder = 'border-slate-200 dark:border-slate-700';
    const recommendedBorder = 'border-indigo-500';

    return (
        <div className={`relative p-8 rounded-2xl border-2 ${isRecommended ? recommendedBorder : baseBorder} bg-white dark:bg-slate-800 shadow-lg flex flex-col`}>
            {isRecommended && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</div>}
            <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">{t(plan.name.toLowerCase())}</h3>
            <div className="text-center my-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                {plan.priceTerm && <span className="text-slate-500 dark:text-slate-400">{plan.priceTerm}</span>}
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map(feature => (
                    <li key={feature} className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                    </li>
                ))}
            </ul>
            <button
                onClick={onSelect}
                disabled={isCurrent}
                className={`w-full py-3 px-4 font-bold rounded-lg transition 
                    ${isCurrent 
                        ? 'cursor-not-allowed bg-green-500 text-white' 
                        : isRecommended 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'}`}
            >
                {isCurrent ? t('current') : t('choosePlan')}
            </button>
        </div>
    )
}

const PlansScreen: React.FC<PlansScreenProps> = ({ user, onNavigate, t }) => {

    const handleSelectPlan = (planName: Plan) => {
        if (!user) { // Not logged in
            onNavigate(Screen.LOGIN);
        } else if (planName === Plan.FREE) {
            // Logic to downgrade or handle free plan selection
            // For now, just navigate back
            onNavigate(Screen.DASHBOARD);
        }
        else {
            onNavigate(Screen.PAYMENT, { plan: planName });
        }
    };
    
  return (
    <div className="w-full max-w-6xl mx-auto text-center fade-in">
      <h2 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">{t('plansTitle')}</h2>
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">{t('plansSubtitle')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plansData.map(plan => (
            <PlanCard 
                key={plan.name} 
                plan={plan} 
                isCurrent={user?.plan === plan.name}
                onSelect={() => handleSelectPlan(plan.name)}
                t={t}
            />
        ))}
      </div>
    </div>
  );
};

export default PlansScreen;