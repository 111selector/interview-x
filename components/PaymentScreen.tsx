import React, { useState } from 'react';
import { Screen, Plan } from '../types';
import { 
    CreditCardIcon, VisaIcon, MastercardIcon, MobileMoneyIcon, 
    GoogleIcon, AppleIcon 
} from './icons';

interface PaymentScreenProps {
  onPaymentSuccess: (newPlan: Plan) => void;
  onNavigate: (screen: Screen) => void;
  t: (key: string) => string;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ onPaymentSuccess, onNavigate, t }) => {
    const [selectedMethod, setSelectedMethod] = useState('card');

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a mock payment. In a real app, you would integrate a payment gateway.
    onPaymentSuccess(Plan.PRO); // Mock: upgrade to Pro
  };

  const PaymentMethodButton: React.FC<{id: string, children: React.ReactNode}> = ({id, children}) => (
      <button 
        type="button" 
        onClick={() => setSelectedMethod(id)}
        className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center transition text-slate-700 dark:text-slate-200 ${selectedMethod === id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
    >
        {children}
    </button>
  );

  return (
    <div className="w-full max-w-lg mx-auto">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">{t('paymentTitle')}</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6">Complete your purchase to unlock the Pro plan.</p>
            
            <form onSubmit={handlePayment}>
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Select Payment Method</h3>
                    <div className="flex gap-3">
                        <PaymentMethodButton id="card"><CreditCardIcon className="w-6 h-6 mr-2 text-slate-600 dark:text-slate-300" /> Card</PaymentMethodButton>
                        <PaymentMethodButton id="mobile"><MobileMoneyIcon className="w-6 h-6 mr-2 text-slate-600 dark:text-slate-300" /> Mobile</PaymentMethodButton>
                    </div>
                     <div className="flex gap-2 text-xs text-slate-400 items-center justify-center">
                        <GoogleIcon className="w-4 h-4"/> Google Pay & <AppleIcon className="w-4 h-4"/> Apple Pay coming soon
                     </div>

                    {selectedMethod === 'card' && (
                        <div className="space-y-4 pt-4">
                             <div className="flex items-center gap-2">
                                <VisaIcon className="h-6"/>
                                <MastercardIcon className="h-6"/>
                            </div>
                            <div>
                                <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Card Number</label>
                                <input type="text" id="cardNumber" placeholder="•••• •••• •••• 4242" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent" required />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label htmlFor="expiry" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Expiry</label>
                                    <input type="text" id="expiry" placeholder="MM / YY" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent" required/>
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="cvc" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">CVC</label>
                                    <input type="text" id="cvc" placeholder="•••" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent" required/>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMethod === 'mobile' && (
                        <div className="pt-4 space-y-4">
                            <div>
                                <label htmlFor="mobileNumber" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Mobile Number</label>
                                <input type="tel" id="mobileNumber" placeholder="Enter your mobile money number" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent" required/>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('momoTitle')}</h4>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300 list-inside">
                                    <li>{t('momoStep1')}</li>
                                    <li>{t('momoStep2')}</li>
                                </ul>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-semibold">{t('momoNote')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition">
                        Pay $30 and Upgrade
                    </button>
                    <button type="button" onClick={() => onNavigate(Screen.PLANS)} className="w-full mt-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 hover:underline">
                        Go Back
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default PaymentScreen;