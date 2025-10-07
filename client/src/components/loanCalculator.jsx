import { number } from "framer-motion";
import React , {useEffect, useState, useRef, memo} from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#3B82F6", "#F97316"];

export const calculateResults = ({amount, interest, years}) =>{
    const userAmount = Number(amount);
    const calculatedIntrest = Number(interest) / 100 / 12;
    const calculatedPayment = Number(years) * 12;
    const x = Math.pow(1 + calculatedIntrest, calculatedPayment);
    const monthly = (userAmount * x * calculatedIntrest) / (x - 1);
    let balance = userAmount;
    if(isFinite(monthly))
    {
        const monthlyPaymentCalculated = monthly.toFixed(2);
        const totalPaymentCalculated = (monthly * calculatedPayment).toFixed(2);
        const totalIntrestCalculated = (monthly * calculatedPayment - amount).toFixed(2);
        let interest = 0;
        let principal = 0;
        let payment = 0;
        for (let i = 1; i <= 12; i++) {
            const interestPayment = balance * calculatedIntrest;
            const principalPayment = monthly - interestPayment;
            // console.log(balance);
            balance -= principalPayment;
            interest += interestPayment;
            principal += principalPayment;
            payment += monthly;
        }
        return({
            amount : amount,
            monthlyPayment : monthlyPaymentCalculated,
            totalPayment : totalPaymentCalculated,
            totalIntrest : totalIntrestCalculated,
            firstYearPayment :  payment.toFixed(3),
            firstYearIntrest : interest.toFixed(3),
            firstYearCapital : principal.toFixed(3),
            isResults : true,
        });
    }
}

const LoanCalculator = memo(()=>{
    const [userValues, setUserValues] = useState({
        amount : '',
        interest : '',
        years : '',
    });
    const [results, setResults] = useState({
        monthlyPayment : '',
        totalPayment : '',
        totalIntrest : '',
        capital : '',
        firstYearPayment : '',
        firstYearIntrest : '',
        firstYearCapital : '',
        isResults : false,
    })




    useEffect(()=>{
        console.log(results)
    },[ results.isResults])

    const handleSubmitInput = ()=>{
        setResults(calculateResults(userValues));
    }

    return(
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Loan Calculator Card */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out
          bg-white shadow-xl rounded-2xl p-8 w-[28rem] h-[34rem] flex flex-col justify-between
          ${results.isResults ? "-translate-x-[150%] opacity-0" : "-translate-x-1/2 opacity-100"}`}
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center">Loan Calculator</h2>

        {/* Inputs */}
        <div className="space-y-4">
          {["Amount", "Interest", "Years"].map((label, i) => (
            <div key={i} className="flex flex-col">
              <label className="font-medium text-gray-700">{label}</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:outline-none"
                type="number"
                placeholder={label}
                onBlur={(e) =>
                  setUserValues({ ...userValues, [label.toLowerCase()]: e.target.value })
                }
                name={label.toLowerCase()}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <button
            className="bg-blue-600 text-white font-semibold w-full py-2 rounded-lg 
              hover:bg-blue-700 transition shadow-md"
            onClick={handleSubmitInput}
          >
            Calculate
          </button>
        </div>
      </div>

      {/* Results Card */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out
          bg-white shadow-xl rounded-2xl p-8 w-[38rem] h-[34rem] overflow-hidden
          ${results.isResults ? "-translate-x-1/2 opacity-100" : "translate-x-[150%] opacity-0"}`}
      >
        {results.isResults && (
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Monthly Payment */}
            <div className="mb-6 text-center">
              <h1 className="font-semibold text-gray-800 text-lg">Estimated Monthly Payment</h1>
              <div className="font-bold text-4xl text-blue-600 mt-2">
                ${results.monthlyPayment}
              </div>
              <div className="mx-auto border-b w-1/3 border-gray-300 mt-3"></div>
            </div>

            {/* First Year Breakdown */}
            <div className="mb-6">
              <h1 className="font-bold text-xl text-gray-800 mb-3">First Year Breakdown</h1>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h2 className="font-medium text-gray-700">Payment</h2>
                  <div className="font-bold text-lg text-gray-900">
                    ${results.firstYearPayment}
                  </div>
                </div>
                <div>
                  <h2 className="font-medium text-gray-700">Interest</h2>
                  <div className="font-bold text-lg text-gray-900">
                    ${results.firstYearIntrest}
                  </div>
                </div>
                <div>
                  <h2 className="font-medium text-gray-700">Capital</h2>
                  <div className="font-bold text-lg text-gray-900">
                    ${results.firstYearCapital}
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Totals */}
            <div className="mb-6">
              <h1 className="font-bold text-xl text-gray-800 mb-3">Loan Summary</h1>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h2 className="font-medium text-gray-700">Total Cost</h2>
                  <div className="font-bold text-lg text-gray-900">${results.totalPayment}</div>
                </div>
                <div>
                  <h2 className="font-medium text-gray-700">Total Interest</h2>
                  <div className="font-bold text-lg text-gray-900">${results.totalIntrest}</div>
                </div>
                <div>
                  <h2 className="font-medium text-gray-700">Loan Amount</h2>
                  <div className="font-bold text-lg text-gray-900">${userValues.amount}</div>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="flex justify-center mt-auto">
              <PieChart width={280} height={280}>
                <Pie
                  data={[
                    { name: "Loan Amount", value: Number(userValues.amount) },
                    { name: "Interest Paid", value: Number(results.totalIntrest) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
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

            {/* Back Button */}
            <div className="flex justify-center mt-6">
              <button
                className="bg-gray-200 text-gray-800 font-medium w-1/3 py-2 rounded-lg 
                  hover:bg-gray-300 transition"
                onClick={() => setResults({ ...results, isResults: false })}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    )
})

export default LoanCalculator;