import React, {useState, useEffect, useRef,useCallback, memo} from "react";
import { useTranslation } from "react-i18next";
import InvestissementTable from "../components/investissementTable";
import InvesSimulationTable from "../components/invesSimulationTable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";


const InvestissementPage = memo(()=>{
    const { t } = useTranslation();
    const [results, setResults] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [userValues, setUserValues] = useState({"Remboursement dette de financement" : {"n+1" : null , "n+2" : null, "n+3" : null}})
    const [loadTables, setLoadTables] = useState(false);
    const [resultsN1, setResultsN1] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [resultsN2, setResultsN2] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [resultsN3, setResultsN3] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [tresorerieData, setTresorerieData] = useState([]);
    const loanResults = useRef(null);
    const simulationId = useRef(0);



    const handleSubmitInput = () =>{
      if(!Object.values(userValues).includes(''))
      {
            setLoadTables(true);
      }
    }
    const handleTresorerieChange = useCallback((newEntry) => {
      setTresorerieData((prev) => {
        // get the current simulation key (ex: "simulate-1")
        const simKey = `simulate-${simulationId.current}`;
    
        // get existing array for this simulation (or empty)
        const existing = prev[simKey] ? prev[simKey].filter((d) => d.year !== newEntry.year) : [];
    
        // merge + sort new entry
        const updated = [...existing, newEntry].sort((a, b) =>
          a.year.localeCompare(b.year)
        );
    
        // return the new state (keeping other simulations untouched)
        return {
          ...prev,
          [simKey]: updated.map((d) => ({
            ...d,
            tresorerie: Math.abs(Number(d.tresorerie)), // ensure numeric values
          })),
        };
      });
    }, []);
    

    // const handleTresorerieChange = useCallback((newEntry) => {
    //   setTresorerieData((prev) => {
    //     const existing = prev.filter((d) => d.year !== newEntry.year);
    //     return ([...existing, newEntry].sort((a, b) =>
    //       a.year.localeCompare(b.year))
    //     );
    //   });
    // }, []);
  return(
        <div className="w-full flex flex-col items-center bg-gray-50 min-h-screen py-6 space-y-6 text-sm">

  {/* Table Section */}
  <div className="w-11/12 max-w-5xl">
    <InvestissementTable setResults={setResults} results={results}/>
  </div>

  {/* Investment Form Card */}
  {!results.isLoading && (<div className="card-premium relative shadow-xl w-full max-w-3xl flex flex-col overflow-hidden">

    <div className="flex items-center justify-center p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-b border-white/10">
      <h2 className="font-display font-bold text-2xl tracking-wide">
        {t('investment.title')}
      </h2>
    </div>

    <div className="p-6 md:p-8 flex flex-col space-y-8">
      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

        {/* Left Column */}
        <div className="space-y-5">
          {[
            { label: t('investment.amount_label'), placeholder: t('investment.placeholder_amount') },
            { label: t('investment.amortization_label'), placeholder: t('investment.placeholder_amortization') },
            { label: t('investment.duration_label'), placeholder: t('investment.placeholder_duration') },
            { label: t('investment.progression_label'), placeholder: t('investment.placeholder_progression') },
            { label: t('investment.dividends_label'), placeholder: t('investment.placeholder_dividends') },
            { label: t('investment.overdraft_label'), placeholder: t('investment.placeholder_overdraft') },

          ].map((field, i) => (
            <div key={i} className="flex flex-col group">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors uppercase tracking-wider">{field.label}</label>
              <input
                // type="number"
                className="w-full px-4 py-2.5 bg-white border border-orange-200/60 rounded-xl 
                           focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 
                           outline-none transition-all duration-300 text-sm font-medium text-slate-800 shadow-sm"
                onBlur={(e) =>
                  setUserValues({ ...userValues, [field.label.toLowerCase()]: Number(e.target.value) })
                }
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col group">
          <label className="text-xs font-semibold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors uppercase tracking-wider">
            {t('investment.loan_repayment_label')}
          </label>

          <div className="flex flex-col space-y-5 mt-1">
            {["n+1", "n+2", "n+3"].map((label, i) => (
              <div key={i} className="flex flex-col">
                <label className="text-[10px] font-bold text-orange-500 mb-1 uppercase tracking-widest">{label}</label>
                <input
                  onBlur={(e) =>
                    setUserValues({ ...userValues, "Remboursement dette de financement" :{...userValues["Remboursement dette de financement"], [label.toLowerCase()]: e.target.value }})
                  }
                  className="w-full px-4 py-2.5 bg-white border border-orange-200/60 rounded-xl 
                             focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 
                             outline-none transition-all duration-300 text-sm font-medium text-slate-800 shadow-sm"
                  placeholder={`${t('investment.placeholder_year_amount')} ${label.toUpperCase()}`}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-4 border-t border-orange-100 mt-6">
        <button
          className="btn-secondary min-w-[130px]"
        >
          {t('common.cancel')}
        </button>
        <button
          className="btn-primary min-w-[130px] !py-2.5"
          onClick={handleSubmitInput}
          onMouseUp={()=>setLoadTables(false)}
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  </div>)}
  {console.log("id == ", simulationId.current)}
  {console.log(tresorerieData)}
  {Object.entries(tresorerieData).length > 0 && (
  <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
      {t('investment.treasury_evolution')}
    </h2>
    <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={(() => {
            // merge all simulations into one array for a single shared X-axis
            const allYears = Array.from(
              new Set(
                Object.values(tresorerieData)
                  .flat()
                  .map((d) => d.year)
              )
            ).sort((a, b) => a.localeCompare(b));

            return allYears.map((year) => {
              const entry = { year };
              for (const [simKey, simData] of Object.entries(tresorerieData)) {
                const found = simData.find((d) => d.year === year);
                entry[simKey] = found ? found.tresorerie : null;
              }
              return entry;
            });
          })()}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tick={{
            fontSize: 14,
            dy: 10, // move labels down (+) or up (-)
            fill: "#374151", // gray-700
          }}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          domain={[
            (dataMin) => {
              const decouvert = Math.abs(Number(userValues["découvert"]) )|| dataMin;
              return Math.min(dataMin, decouvert); // make sure Y-axis starts at least at the découvert
            },
            (dataMax) => {
              const decouvert = Math.abs(Number(userValues["découvert"])) || dataMax;
              return Math.max(dataMax, decouvert); // make sure Y-axis starts at least at the découvert
            }, // let max be automatic
          ]}
          tickFormatter={(value) => `${Number(value.toFixed(0)).toLocaleString()} MAD`}
        />
        <Tooltip  formatter={(v) => `${Number(v.toFixed(0)).toLocaleString()} MAD`} />
        {Object.keys(tresorerieData).map((simKey, index) => (
          <Line
            key={simKey}
            type="monotone"
            dataKey={simKey} // ✅ use simulation key as dataKey
            name={simKey}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            stroke={[
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
            ][index % 5]}
          />
        ))}
        <ReferenceLine
          y={Math.abs(Number(userValues["découvert"]))}
          stroke="red"
          strokeDasharray="5 5"
          strokeWidth={2}
          label={{
            value: `${t('investment.decouvert_label')} (${Math.abs(Number(userValues["découvert"])).toLocaleString()} MAD)`,
            position: "middle",
            dy: 10,
            // dx: 60,
            fill: "red",
            fontSize: 10,
            fontWeight: 600,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
      )}
  {loadTables && (
    <div className=" space-y-4">
      { !results.isLoading &&(<InvesSimulationTable setResults={setResultsN1} results={results} userValues={userValues} tableId={1} loanResults={loanResults} initResults={results} onTresorerieChange={handleTresorerieChange} simulationId={simulationId}/>)}
      { !resultsN1.isLoading && (<InvesSimulationTable setResults={setResultsN2} results={resultsN1} userValues={userValues} tableId={2} loanResults={loanResults} initResults={results} onTresorerieChange={handleTresorerieChange} simulationId={simulationId}/>)}
      { !resultsN2.isLoading &&(<InvesSimulationTable setResults={setResultsN3} results={resultsN2} userValues={userValues} tableId={3} loanResults={loanResults} initResults={results} onTresorerieChange={handleTresorerieChange} simulationId={simulationId}/>)}
      {console.log(loanResults)}
    </div>
  )}
</div>


    )
})

export default InvestissementPage;