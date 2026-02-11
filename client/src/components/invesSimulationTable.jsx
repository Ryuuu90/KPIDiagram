import { useState, useEffect, memo, useMemo } from "react";
import { useDeepCompareEffect } from "use-deep-compare";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaBalanceScale, FaChartBar, FaFileInvoice, FaKaaba } from "react-icons/fa";
import axios from "axios";
import LoanCalculator, { calculateResults } from "./loanCalculator";


const URL = process.env.REACT_APP_BACKEND_URL;

const InvesSimulationTable = memo(({ setResults, results, userValues, tableId, loanResults, initResults, onTresorerieChange, simulationId }) => {
  const [passifData, setPassifData] = useState([]);
  const [actifData, setActifData] = useState([]);
  const [cpcData, setCpcData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resimulationCard, setResimulationCard] = useState(false);
  const [userInput, setUserInput] = useState({
    "Progression de l'activité": null, "Distriution des dividendes": null,
    "Dette de financement": { "Montant": null, "Durée": null, "Taux": null },
    "Augmentation de capital": null
  })

  useDeepCompareEffect(() => {
    const getAllReports = () => {
      console.log(tableId);
      setIsLoading(true);

      try {
        const cpcReport = () => {
          const progression = userValues["progression de l'activité"] / 100;

          const dataMap = Object.fromEntries(
            results.Cpc.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
          );

          const updatedProduits = dataMap['Produits'] * (1 + progression);
          const updatedAchats = dataMap['Achats'] * (1 + progression);
          const updatedPersonnel = dataMap['Personnel'] * (1 + progression);

          const profitOld =
            dataMap['Produits'] -
            (dataMap['Achats'] + dataMap['Personnel'] + dataMap['Dotations'] + dataMap['Résultat financier']);

          const profitNew =
            updatedProduits -
            (updatedAchats + updatedPersonnel + dataMap['Dotations'] + dataMap['Résultat financier']);

          const updatedIS = dataMap['IS'] * (profitNew / profitOld);

          const updatedResultatNet = updatedProduits - (updatedAchats + updatedPersonnel + updatedIS + dataMap['Dotations']) + dataMap['Résultat financier'];

          const cpc = {
            ...dataMap,
            Produits: updatedProduits,
            Achats: updatedAchats,
            Personnel: updatedPersonnel,
            IS: updatedIS,
            'Résultat net': updatedResultatNet,
          };
          return Object.entries(cpc).map(([key, value]) => ({
            label: key,
            value: value,
          }));
        };
        const passifReport = () => {
          const dataMap = Object.fromEntries(
            results.Passif.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
          );
          const updatedReserves = dataMap['Réserves'] + dataMap['Résultat net'] - userValues['distribution des dividendes'] / 100 * dataMap['Résultat net'];
          const cpc = cpcReport()
          const updatedResNet = cpc.find(elem => elem.label === "Résultat net").value;
          const updatedDateFinance = dataMap["Dettes de financement"] - userValues["Remboursement dette de financement"][`n+${tableId}`];
          const updatedDateFour = dataMap["Dettes fournisseurs"] * (1 + userValues["progression de l'activité"] / 100);
          const passif = {
            ...dataMap,
            Réserves: updatedReserves,
            "Résultat net": updatedResNet,
            "Dettes de financement": updatedDateFinance,
            "Dettes fournisseurs": updatedDateFour,
            "Total": 0,
          }
          passif.Total = Object.values(passif).reduce((sum, value) => sum + value, 0);
          return Object.entries(passif).map(([key, value]) => ({
            label: key,
            value: value,
          }));

        }
        const actifReport = () => {
          const dataMap = Object.fromEntries(
            results.Actif.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
          );
          const updatedImmob = dataMap['Immobilisations'] + (userValues["montant de l'investissement ht"] / userValues["durée d'investissement"]);
          const cpc = cpcReport();
          const updatedAmort = dataMap["Amortissement"] - cpc.find(elem => elem.label === 'Dotations').value;
          const updatedStock = dataMap["Stock"] * (1 + userValues["progression de l'activité"] / 100);
          const updatedCreances = dataMap["Créances"] * (1 + userValues["progression de l'activité"] / 100);
          const passif = passifReport();
          const totalPassif = passif.find(elem => elem.label === 'Total').value;
          const updatedTresorerie = totalPassif - (updatedImmob + updatedAmort + updatedStock + updatedCreances);
          const actif = {
            ...dataMap,
            "Immobilisations": updatedImmob,
            "Amortissement": updatedAmort,
            "Stock": updatedStock,
            "Créances": updatedCreances,
            "Trésorerie": updatedTresorerie,
            "Total": 0,
          }
          actif.Total = Object.values(actif).reduce((sum, value) => sum + value, 0);
          return Object.entries(actif).map(([key, value]) => ({
            label: key,
            value: value,
          }));
        }

        const [passif, actif, cpc] = [
          passifReport(),
          actifReport(),
          cpcReport(),
        ];
        setResults((results) => ({ ...results, Passif: passif, Actif: actif, Cpc: cpc }))

        setPassifData(passif);
        setActifData(actif);
        setCpcData(cpc);
      } catch (error) {
        console.error("Erreur lors du chargement des rapports:", error.message);
      } finally {
        setIsLoading(false);
        setResults(results => ({ ...results, isLoading: false }));

      }
    };

    getAllReports();
  }, [results]);

  const formatCurrency = (value) => (
    <span className="font-semibold text-green-600">
      {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) +
        " MAD"}
    </span>
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "label",
        header: "Label",
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      },
      {
        accessorKey: "value",
        header: "Valeur",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
    ],
    []
  );

  // === Three tables ===
  const passifTable = useReactTable({
    data: passifData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      pagination: { pageIndex: 0, pageSize: passifData.length },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const actifTable = useReactTable({
    data: actifData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      pagination: { pageIndex: 0, pageSize: actifData.length },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const cpcTable = useReactTable({
    data: cpcData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      pagination: { pageIndex: 0, pageSize: cpcData.length },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const reports = [
    { name: "CPC", icon: <FaFileInvoice />, table: cpcTable, data: cpcData },
    { name: "Passif", icon: <FaBalanceScale />, table: passifTable, data: passifData },
    { name: "Actif", icon: <FaChartBar />, table: actifTable, data: actifData },
  ];

  const resimulationCalcul = () => {
    const amount = userInput['Dette de financement']['Montant'];
    const years = userInput['Dette de financement']['Durée'];
    const interest = userInput['Dette de financement']['Taux'];
    console.log(tableId);
    simulationId.current = tableId;
    const loanCalculation = calculateResults({ amount, interest, years });
    console.log(loanCalculation);
    loanResults.current = { ...loanResults.current, [`N+${tableId}`]: loanCalculation['simulation'] };
    const cpcReport = () => {
      const progression = userInput["Progression de l'activité"] / 100;

      const dataMap = Object.fromEntries(
        results.Cpc.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
      );
      const initDataMap = Object.fromEntries(
        initResults.Cpc.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
      );

      const updatedProduits = dataMap['Produits'] * (1 + progression);
      const updatedAchats = dataMap['Achats'] * (1 + progression);
      const updatedPersonnel = dataMap['Personnel'] * (1 + progression);
      console.log(loanCalculation)
      // const updatedResFin = tableId === 1 ? dataMap['Résultat financier'] - loanCalculation['simulation']['firstYearIntrest'] : 
      //                       tableId === 2 && loanResults.current?.[`N+${tableId - 1}`] ? dataMap['Résultat financier'] - loanResults.current?.[`N+${tableId - 1}`]?.['secondYearIntrest'] - LoanCalculator['simulation']['firstYearIntrest']:
      //                       dataMap['Résultat financier'] - loanResults.current?.[`N+${tableId - 1}`]['secondYearIntrest'] - LoanCalculator['simulation']['firstYearIntrest'] - loanResults.current?.[`N+${tableId - 2}`]['thirdYearIntrest'] - loanResults.current?.[`N+${tableId - 1}`]['thirdYearIntrest']  - LoanCalculator['simulation']['thirdYearIntrest']

      let updatedResFin = tableId === 2 ? initDataMap['Résultat financier'] : dataMap['Résultat financier'];
      if (tableId === 1)
        updatedResFin -= loanCalculation['simulation'] ? loanCalculation['simulation']['firstYearIntrest'] : 0;
      else if (tableId === 2) {
        updatedResFin -= loanCalculation['simulation'] ? loanCalculation['simulation']['firstYearIntrest'] : 0;
        if (loanResults.current[`N+${tableId - 1}`])
          updatedResFin -= loanResults.current?.[`N+${tableId - 1}`]?.['secondYearIntrest'];
        else
          updatedResFin -= loanCalculation['simulation'] ? loanCalculation['simulation']['secondYearIntrest'] : 0;
      }
      else if (tableId === 3) {

        updatedResFin -= loanCalculation['simulation'] ? loanCalculation['simulation']['thirdYearIntrest'] : 0;
        if (loanResults.current[`N+${tableId - 2}`])
          updatedResFin -= loanResults.current?.[`N+${tableId - 2}`]['thirdYearIntrest'];
        else
          updatedResFin -= loanCalculation['simulation'] ? loanCalculation['simulation']['thirdYearIntrest'] : 0;
        if (loanResults.current[`N+${tableId - 1}`])
          updatedResFin -= loanResults.current?.[`N+${tableId - 1}`]['thirdYearIntrest'];
        else
          updatedResFin -= loanCalculation['simulation'] ? loanCalculation['simulation']['thirdYearIntrest'] : 0;
      }

      const updatedDotation = tableId === 3 ? dataMap['Dotations'] + (userValues["montant de l'investissement ht"] / userValues["durée d'amortissement"]) : dataMap['Dotations'];
      const profitOld =
        initDataMap['Produits'] - (initDataMap['Achats'] + initDataMap['Personnel'] + initDataMap['Dotations'] + initDataMap['Résultat financier']);
      const profitNew =
        updatedProduits - (updatedAchats + updatedPersonnel + updatedDotation + updatedResFin);


      const updatedIS = initDataMap['IS'] * (profitNew / profitOld);

      const updatedResultatNet = updatedProduits - (updatedAchats + updatedPersonnel + updatedIS + updatedDotation) + dataMap['Résultat financier'];

      const cpc = {
        ...dataMap,
        Produits: updatedProduits,
        Achats: updatedAchats,
        Personnel: updatedPersonnel,
        Dotations: updatedDotation,
        'Résultat financier': updatedResFin,
        IS: updatedIS,
        'Résultat net': updatedResultatNet,
      };

      return Object.entries(cpc).map(([key, value]) => ({
        label: key,
        value: value,
      }));

    };
    const passifReport = () => {
      const dataMap = Object.fromEntries(
        results.Passif.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
      );
      const updatedCapital = dataMap['Capital'] + Number(userInput['Augmentation de capital']);
      let loanCapital = 0;
      if (tableId === 1) {
        loanCapital = loanCalculation['simulation'] ? Number(loanCalculation['simulation']['firstYearCapital']) : 0;
      }
      if (tableId === 2) {
        if (loanCalculation['simulation'])
          loanCapital += Number(loanCalculation['simulation']['firstYearCapital']);
        if (loanResults.current[`N+${tableId - 1}`])
          loanCapital += Number(loanResults.current[`N+${tableId - 1}`]['secondYearCapital']);
      }
      if (tableId === 3) {
        if (loanCalculation['simulation'])
          loanCapital += Number(loanCalculation['simulation']['firstYearCapital']);
        if (loanResults.current[`N+${tableId - 1}`])
          loanCapital += Number(loanResults.current[`N+${tableId - 1}`]['secondYearCapital']);
        if (loanResults.current[`N+${tableId - 2}`])
          loanCapital += Number(loanResults.current[`N+${tableId - 2}`]['thirdYearCapital']);
      }


      const updatedReserves = dataMap['Réserves'] + dataMap['Résultat net'] - (userInput['Distriution des dividendes'] / 100 * dataMap['Résultat net']);
      const cpc = cpcReport()
      const updatedResNet = cpc.find(elem => elem.label === "Résultat net").value;
      const updatedDateFinance = dataMap["Dettes de financement"] - userValues["Remboursement dette de financement"][`n+${tableId}`] + Number(userInput['Dette de financement']['Montant']) - Number(loanCapital);
      const updatedDateFour = dataMap["Dettes fournisseurs"] * (1 + userInput["Progression de l'activité"] / 100);
      const passif = {
        ...dataMap,
        "Capital": updatedCapital,
        Réserves: updatedReserves,
        "Résultat net": updatedResNet,
        "Dettes de financement": updatedDateFinance,
        "Dettes fournisseurs": updatedDateFour,
        "Total": 0,
      }
      passif.Total = Object.values(passif).reduce((sum, value) => sum + value, 0);
      return Object.entries(passif).map(([key, value]) => ({
        label: key,
        value: value,
      }));
    }
    const actifReport = () => {
      const dataMap = Object.fromEntries(
        results.Actif.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
      );
      const updatedImmob = dataMap['Immobilisations'] + (userValues["montant de l'investissement ht"] / userValues["durée d'investissement"]);
      const cpc = cpcReport();
      const updatedAmort = dataMap["Amortissement"] - cpc.find(elem => elem.label === 'Dotations').value;
      const updatedStock = dataMap["Stock"] * (1 + userInput["Progression de l'activité"] / 100);
      const updatedCreances = dataMap["Créances"] * (1 + userInput["Progression de l'activité"] / 100);
      const passif = passifReport();
      const totalPassif = passif.find(elem => elem.label === 'Total').value;
      const updatedTresorerie = totalPassif - (updatedImmob + updatedAmort + updatedStock + updatedCreances);
      const actif = {
        ...dataMap,
        "Immobilisations": updatedImmob,
        "Amortissement": updatedAmort,
        "Stock": updatedStock,
        "Créances": updatedCreances,
        "Trésorerie": updatedTresorerie,
        "Total": 0,
      }
      actif.Total = Object.values(actif).reduce((sum, value) => sum + value, 0);
      return Object.entries(actif).map(([key, value]) => ({
        label: key,
        value: value,
      }));
    }

    const [cpc, passif, actif] = [cpcReport(), passifReport(), actifReport()];
    setResults(results => ({ ...results, Cpc: cpc, Passif: passif, Actif: actif }));
    setCpcData(cpc);
    setPassifData(passif);
    setActifData(actif);


  }
  useEffect(() => {
    if (!actifData || !actifData.length) return;

    const tresoItem = actifData.find((elem) => elem.label === "Trésorerie");
    if (tresoItem) {
      // send the value to the parent
      onTresorerieChange({ year: `N+${tableId}`, tresorerie: Number(tresoItem.value) });
    }
  }, [tableId, actifData.find((elem) => elem.label === "Trésorerie")]);

  return (
    <div className="p-6 ">
      <h1 className="text-center  text-gray-700 font-bold text-5xl">N+{tableId}</h1>
      <div className="max-w-12xl mx-auto">
        {/* Search bar */}
        <button className={`relative ${resimulationCard ? "hidden" : ""} bottom-12 btn-primary !px-4 !py-2`} onClick={() => setResimulationCard(true)}>Resimulation</button>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-finance-accent"></div>
            <p className="mt-2 text-slate-500 font-medium">Chargement des rapports...</p>
          </div>
        ) : (
          <>
            <div
              className={`relative bottom-11 transition-all duration-700 ${resimulationCard
                ? "w-80 top-[3.8rem] right-[9.1rem] h-[3.75rem] p-3"
                : "w-0 h-0 p-0 bg-transparent"
                } font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-center rounded-t-xl text-white`}
            >
              <h1 className="text-2xl">{resimulationCard ? "Simulation" : ""}</h1>

              {/* Content card */}
              <div
                className={`relative transition-all flex flex-col justify-around duration-700 shadow-lg bg-white rounded ${resimulationCard
                  ? "w-80 top-7 h-[17.5rem] right-3 opacity-100 translate-y-0"
                  : "w-0 h-0 p-0 opacity-0 translate-y-5 pointer-events-none"
                  }`}
              >
                {["Progression de l'activité", "Distriution des dividendes", "Dette de financement :", "Montant", "Durée", "Taux", "Augmentation de capital"].map((label, i) => {
                  if (label === "Dette de financement :")
                    return (
                      <div key={i} className="flex flex-row justify-between transition-all duration-[1700ms]">
                        <h1
                          className={`text-black ml-[0.6rem] font-medium transition-opacity duration-[1700ms] ${resimulationCard ? "opacity-100" : "opacity-0"
                            }`}
                        >
                          Dette de financement :
                        </h1>
                      </div>
                    );
                  else if (label === "Montant" || label === "Durée" || label === "Taux")
                    return (
                      <div
                        key={i}
                        className={`flex flex-row justify-between transition-all duration-[1700ms] ${resimulationCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                          }`}
                      >
                        <h1 className="text-green-500 ml-[0.6rem] font-medium">- {label}</h1>
                        <input
                          className="w-28 mr-[0.7rem] text-slate-800 px-2 py-1 -mt-1 bg-slate-50 border border-slate-200 rounded-lg 
                                    focus:ring-2 focus:ring-finance-accent/20 focus:border-finance-accent
                                    outline-none transition-all text-sm font-medium"
                          type="text"
                          onBlur={(e) => setUserInput({ ...userInput, "Dette de financement": { ...userInput["Dette de financement"], [label]: e.target.value } })}
                          placeholder={`Ex: ${label === "Montant" ? "500000" : label === "Durée" ? "7" : "4%"
                            }`}
                        />
                      </div>
                    );

                  return (
                    <div
                      key={i}
                      className={`flex flex-row justify-between transition-all duration-[1700ms] ${resimulationCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}
                    >
                      <h1 className="text-black ml-[0.6rem] font-medium">{label}</h1>
                      <input
                        className="w-28 mr-[0.7rem] text-black px-2 p-[0.15rem] -mt-1 border border-gray-300 rounded-md 
                                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                                  outline-none transition-all text-sm"
                        onBlur={(e) => setUserInput({ ...userInput, [label]: e.target.value })}
                        type="text"
                        placeholder={`Ex: ${label === "Augmentation de capital" ? "300000" : "5%"
                          } `}
                      />
                    </div>
                  );
                })}
                <button className={`btn-primary !px-4 !py-1.5 transition-all duration-[2000ms] ${resimulationCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  } self-center`}
                  onClick={resimulationCalcul}>simulate</button>
              </div>
            </div>

            <div className={` transition-all duration-700 ${resimulationCard ? "gap-0 translate-x-44" : "gap-6"}  grid grid-cols-1 md:grid-cols-3`}>
              {reports.map(({ name, icon, table, data }) => (
                <div
                  key={name}
                  className="card-premium flex flex-col h-full"
                >
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-b border-white/10">
                    <span className="text-xl p-2 bg-white/10 rounded-lg text-finance-accent">{icon}</span>
                    <h2 className="font-display font-bold text-lg tracking-wide">{name}</h2>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <th
                                key={header.id}
                                className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {table.getRowModel().rows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className={`px-4 py-3 font-medium text-slate-700 ${typeof cell.getValue() === "number"
                                  ? "text-right"
                                  : "text-left"
                                  }`}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {data.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic bg-slate-50/50">
                      Aucun résultat pour {name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>

    </div>
  );
});

export default InvesSimulationTable;
