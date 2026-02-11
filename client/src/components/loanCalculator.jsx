import { number } from "framer-motion";
import React, { useEffect, useState, useRef, memo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#3B82F6", "#F97316"];

export const calculateResults = ({ amount, interest, years }) => {
  const userAmount = Number(amount);
  const calculatedIntrest = Number(interest) / 100 / 12;
  const calculatedPayment = Number(years) * 12;
  if (!userAmount || !calculatedIntrest || !calculatedPayment) {
    return {
      isResults: false,
      error: "Veuillez entrer un montant, un taux d'intérêt et une durée valides.",
    };
  }
  const x = Math.pow(1 + calculatedIntrest, calculatedPayment);
  const monthly = (userAmount * x * calculatedIntrest) / (x - 1);
  let balance = userAmount;
  if (isFinite(monthly)) {
    const monthlyPaymentCalculated = monthly.toFixed(3);
    const totalPaymentCalculated = (monthly * calculatedPayment).toFixed(3);
    const totalIntrestCalculated = (monthly * calculatedPayment - amount).toFixed(3);
    let interest = 0;
    let principal = 0;
    let payment = 0;
    let interestN2 = 0;
    let principalN2 = 0;
    let paymentN2 = 0;
    let interestN3 = 0;
    let principalN3 = 0;
    let paymentN3 = 0;

    for (let i = 1; i <= 36; i++) {
      if (i >= 1 && i <= 12) {
        const interestPayment = balance * calculatedIntrest;
        const principalPayment = monthly - interestPayment;
        // console.log(balance);
        balance -= principalPayment;
        interest += interestPayment;
        principal += principalPayment;
        payment += monthly;
      }
      if (i > 12 && i <= 24) {
        const interestPayment = balance * calculatedIntrest;
        const principalPayment = monthly - interestPayment;
        // console.log(balance);
        balance -= principalPayment;
        interestN2 += interestPayment;
        principalN2 += principalPayment;
        paymentN2 += monthly;
      }
      if (i > 24 && i <= 36) {
        const interestPayment = balance * calculatedIntrest;
        const principalPayment = monthly - interestPayment;
        // console.log(balance);
        balance -= principalPayment;
        interestN3 += interestPayment;
        principalN3 += principalPayment;
        paymentN3 += monthly;
      }
    }
    return ({
      amount: amount,
      monthlyPayment: monthlyPaymentCalculated,
      totalPayment: totalPaymentCalculated,
      totalIntrest: totalIntrestCalculated,
      firstYearPayment: payment.toFixed(0),
      firstYearIntrest: interest.toFixed(0),
      firstYearCapital: principal.toFixed(0),
      simulation: {
        firstYearPayment: payment.toFixed(0),
        firstYearIntrest: interest.toFixed(0),
        firstYearCapital: principal.toFixed(0),
        secondYearPayment: paymentN2.toFixed(0),
        secondYearIntrest: interestN2.toFixed(0),
        secondYearCapital: principalN2.toFixed(0),
        thirdYearPayment: paymentN3.toFixed(0),
        thirdYearIntrest: interestN3.toFixed(0),
        thirdYearCapital: principalN3.toFixed(0),

      },
      isResults: true,
    });
  }
}

const LoanCalculator = memo(() => {
  const [userValues, setUserValues] = useState({
    amount: '',
    interest: '',
    years: '',
  });
  const [results, setResults] = useState({
    monthlyPayment: '',
    totalPayment: '',
    totalIntrest: '',
    capital: '',
    firstYearPayment: '',
    firstYearIntrest: '',
    firstYearCapital: '',
    isResults: false,
  })




  useEffect(() => {
    console.log(results)
  }, [results.isResults])

  const handleSubmitInput = () => {
    setResults(calculateResults(userValues));
  }

  return (
    <div className="w-full flex items-center justify-center p-6 animate-fade-in">
      <div className="relative w-full max-w-5xl h-[40rem] flex items-center justify-center">
        {/* Loan Calculator Card */}
        <div
          className={`absolute inset-0 m-auto transition-all duration-700 ease-in-out z-20
          card-premium border-l-4 border-finance-accent p-8 w-[28rem] h-[36rem] flex flex-col justify-between
          ${results.isResults ? "-translate-x-[60%] scale-95 opacity-80 blur-[1px]" : "translate-x-0 opacity-100 shadow-2xl"}`}
          onClick={() => results.isResults && setResults({ ...results, isResults: false })}
        >
          <div>
            <h2 className="text-3xl font-display font-bold text-finance-primary text-center mb-8">Loan Calculator</h2>

            {/* Inputs */}
            <div className="space-y-6">
              {["Amount", "Interest", "Years"].map((label, i) => (
                <div key={i} className="flex flex-col group">
                  <label className="text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-finance-accent transition-colors">{label}</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium
                  focus:ring-2 focus:ring-finance-accent/20 focus:border-finance-accent outline-none transition-all placeholder:text-slate-300"
                    type="number"
                    placeholder={label === 'Interest' ? 'Ex: 5' : label === 'Years' ? 'Ex: 10' : '0.00'}
                    onBlur={(e) =>
                      setUserValues({ ...userValues, [label.toLowerCase()]: e.target.value })
                    }
                    name={label.toLowerCase()}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              className="btn-primary w-full py-3.5 text-lg shadow-blue-900/10 hover:shadow-blue-900/20"
              onClick={handleSubmitInput}
            >
              Calculate Repayment
            </button>
          </div>
        </div>

        {/* Results Card */}
        <div
          className={`absolute inset-0 m-auto transition-all duration-700 ease-in-out z-30
          card-premium border-t-4 border-finance-success p-8 w-[42rem] h-[38rem] overflow-hidden
          ${results.isResults ? "translate-x-0 opacity-100 shadow-2xl" : "translate-x-[60%] opacity-0 pointer-events-none"}`}
        >
          {results.isResults && (
            <div className="h-full flex flex-col">
              {/* Monthly Payment */}
              <div className="mb-8 text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h1 className="font-medium text-slate-500 text-sm uppercase tracking-wider mb-2">Estimated Monthly Payment</h1>
                <div className="font-display font-bold text-5xl text-finance-primary">
                  {results.monthlyPayment.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} <span className="text-2xl text-slate-400 font-sans">MAD</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {/* First Year Breakdown */}
                <div>
                  <h1 className="font-display font-bold text-xl text-finance-primary mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-finance-accent rounded-full" /> First Year Breakdown</h1>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Payment", value: results.firstYearPayment },
                      { label: "Interest", value: results.firstYearIntrest },
                      { label: "Capital", value: results.firstYearCapital }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h2 className="text-xs font-bold text-slate-400 uppercase mb-1">{item.label}</h2>
                        <div className="font-bold text-lg text-slate-800">{item.value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loan Totals */}
                <div>
                  <h1 className="font-display font-bold text-xl text-finance-primary mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-finance-success rounded-full" /> Loan Summary</h1>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Total Cost", value: results.totalPayment },
                      { label: "Total Interest", value: results.totalIntrest },
                      { label: "Loan Amount", value: userValues.amount }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h2 className="text-xs font-bold text-slate-400 uppercase mb-1">{item.label}</h2>
                        <div className="font-bold text-lg text-slate-800">{item.value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="flex justify-center items-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                  <PieChart width={280} height={200}>
                    <Pie
                      data={[
                        { name: "Loan Amount", value: Number(userValues.amount) },
                        { name: "Interest Paid", value: Number(results.totalIntrest) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={index} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </div>
              </div>

              {/* Back Button */}
              <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                <button
                  className="text-slate-500 font-medium hover:text-finance-primary transition flex items-center gap-2"
                  onClick={() => setResults({ ...results, isResults: false })}
                >
                  ← Calculate New Loan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default LoanCalculator;