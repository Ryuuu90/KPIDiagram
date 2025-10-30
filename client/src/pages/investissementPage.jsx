import React, {useState, useEffect, useRef,useCallback, memo} from "react";
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
    const [results, setResults] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [userValues, setUserValues] = useState({"Remboursement dette de financement" : {"n+1" : null , "n+2" : null, "n+3" : null}})
    const [loadTables, setLoadTables] = useState(false);
    const [resultsN1, setResultsN1] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [resultsN2, setResultsN2] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [resultsN3, setResultsN3] = useState({Passif : null, Actif : null , Cpc : null , isLoading : true});
    const [tresorerieData, setTresorerieData] = useState([]);
    const loanResults = useRef(null);



    const handleSubmitInput = () =>{
      if(!Object.values(userValues).includes(''))
      {
            setLoadTables(true);
      }
    }

    const handleTresorerieChange = useCallback((newEntry) => {
      setTresorerieData((prev) => {
        const existing = prev.filter((d) => d.year !== newEntry.year);
        return [...existing, newEntry].sort((a, b) =>
          a.year.localeCompare(b.year)
        );
      });
    }, []);
  return(
        <div className="w-full flex flex-col items-center bg-gray-50 min-h-screen py-6 space-y-6 text-sm">

  {/* Table Section */}
  <div className="w-11/12 max-w-5xl">
    <InvestissementTable setResults={setResults} results={results}/>
  </div>

  {/* Investment Form Card */}
  {!results.isLoading && (<div className="relative bg-white shadow-lg rounded-2xl p-6 w-full max-w-3xl flex flex-col space-y-6 border border-gray-100">

    <h2 className="text-lg font-semibold text-gray-800 text-center mb-2">
      Simulation d’investissement
    </h2>
    {/* Inputs Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Left Column */}
      <div className="space-y-4">
        {[
          { label: "Montant de l'investissement HT", placeholder: "Ex: 250000 MAD" },
          { label: "Durée d'amortissement", placeholder: "Ex: 5 ans" },
          { label: "Durée d'investissement", placeholder: "Ex: 7 ans" },
          { label: "Progression de l'activité", placeholder: "Ex: 10%" },
          { label: "Distribution des dividendes", placeholder: "Ex: 20%" },
          { label: "Découvert", placeholder: "Ex: -10000000 MAD" },

        ].map((field, i) => (
          <div key={i} className="flex flex-col">
            <label className="text-gray-700 font-medium mb-0.5">{field.label}</label>
            <input
              // type="number"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md 
                         focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                         outline-none transition-all text-sm"
                onBlur={(e) =>
                setUserValues({ ...userValues, [field.label.toLowerCase()]: Number(e.target.value) })
                }
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Right Column */}
      <div className="relative flex flex-col ">
        <label className="text-gray-700 font-medium mb-1">
          Remboursement dette de financement
        </label>

        <div className="relative  -top-1 grid grid-cols-1 gap-[2.43rem]">
          {["n+1", "n+2", "n+3"].map((label, i) => (
            <input
              key={i}
              onBlur={(e) =>
                setUserValues({ ...userValues, "Remboursement dette de financement" :{...userValues["Remboursement dette de financement"], [label.toLowerCase()]: e.target.value }})
              }
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md 
                         focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                         outline-none transition-all text-sm"
              placeholder={label}
            />
          ))}
        </div>
      </div>

    </div>

    {/* Action Buttons */}
    <div className="flex justify-center space-x-3 pt-2">
      <button
        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all text-sm"
      >
        Annuler
      </button>
      <button
        className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-all text-sm"
        onClick={handleSubmitInput}
        onMouseUp={()=>setLoadTables(false)}
        
      >
        Enregistrer
      </button>
    </div>

  </div>)}
  {tresorerieData.length > 0 && (
  <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
      Évolution de la Trésorerie
    </h2>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={tresorerieData.map(d => ({
          ...d,
          tresorerie: Math.abs(Number(d.tresorerie)), // ✅ ensure numeric values
        }))}
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
              const decouvert = Number(userValues["découvert"]) || dataMin;
              return Math.min(dataMin, decouvert); // make sure Y-axis starts at least at the découvert
            },
            (dataMax) => {
              const decouvert = Number(userValues["découvert"]) || dataMax;
              return Math.max(dataMax, decouvert); // make sure Y-axis starts at least at the découvert
            }, // let max be automatic
          ]}
          tickFormatter={(value) => `${Number(value.toFixed(0)).toLocaleString()} MAD`}
        />
        <Tooltip  formatter={(v) => `${Number(v).toLocaleString()} MAD`} />
        <Line
          type="monotone"
          dataKey="tresorerie"
          stroke="#2563EB"
          strokeWidth={3}
          dot={{ r: 6, fill: "#2563EB" }}
        />
        <ReferenceLine
          y={Math.abs(Number(userValues["découvert"]))}
          stroke="red"
          strokeDasharray="5 5"
          strokeWidth={2}
          label={{
            value: `Découvert (${userValues["découvert"].toLocaleString()} MAD)`,
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
      { !results.isLoading &&(<InvesSimulationTable setResults={setResultsN1} results={results} userValues={userValues} tableId={1} loanResults={loanResults} initResults={results} onTresorerieChange={handleTresorerieChange}/>)}
      { !resultsN1.isLoading && (<InvesSimulationTable setResults={setResultsN2} results={resultsN1} userValues={userValues} tableId={2} loanResults={loanResults} initResults={results} onTresorerieChange={handleTresorerieChange}/>)}
      { !resultsN2.isLoading &&(<InvesSimulationTable setResults={setResultsN3} results={resultsN2} userValues={userValues} tableId={3} loanResults={loanResults} initResults={results} onTresorerieChange={handleTresorerieChange}/>)}
      {console.log(loanResults)}
    </div>
  )}
</div>


    )
})

export default InvestissementPage;