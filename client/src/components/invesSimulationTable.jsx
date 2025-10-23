import { useState, useEffect, memo, useMemo } from "react";
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


const URL = process.env.REACT_APP_BACKEND_URL;

const InvesSimulationTable = memo(({setResults, results, userValues, tableId}) => {
  const [passifData, setPassifData] = useState([]);
  const [actifData, setActifData] = useState([]);
  const [cpcData, setCpcData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getAllReports =  () => {
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
            
            const updatedResultatNet =  updatedProduits - (updatedAchats+ updatedPersonnel +  updatedIS + dataMap['Dotations']) + dataMap['Résultat financier'] ;
            
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
        const passifReport = ()=>{
          const dataMap = Object.fromEntries(
            results.Passif.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
          );
          const updatedReserves = dataMap['Réserves'] + dataMap['Résultat net'] - userValues['distribution des dividendes'] / 100 * dataMap['Résultat net'];
          const cpc = cpcReport()
          const updatedResNet = cpc.find(elem => elem.label === "Résultat net").value;
          const updatedDateFinance = dataMap["Dettes de financement"] - userValues["Remboursement dette de financement"][`n+${tableId}`];
          const updatedDateFour  = dataMap["Dettes fournisseurs"] * (1 + userValues["progression de l'activité"] / 100);
          const passif = {
            ...dataMap,
            Réserves: updatedReserves,
            "Résultat net" : updatedResNet,
            "Dettes de financement" : updatedDateFinance,
            "Dettes fournisseurs" : updatedDateFour,   
            "Total" : 0,         
          }
          passif.Total = Object.values(passif).reduce((sum, value)=> sum + value, 0);
          return Object.entries(passif).map(([key, value]) => ({
            label: key,
            value: value,
          }));

        }
        const actifReport = () =>{
          const dataMap = Object.fromEntries(
            results.Actif.map(elem => [elem.label, Number(elem.value)]) // ensure numeric
          );
          const updatedImmob = dataMap['Immobilisations'] + (userValues["montant de l'investissement ht"] / userValues["progression de l'activité"] / 100);
          const cpc = cpcReport();
          const updatedAmort = dataMap["Amortissement"] - cpc.find(elem => elem.label === 'Dotations').value;
          const updatedStock = dataMap["Stock"] * (1 + userValues["progression de l'activité"] / 100);
          const updatedCreances = dataMap["Créances"] * (1 + userValues["progression de l'activité"] / 100);
          const passif = passifReport();
          const totalPassif = passif.find(elem => elem.label === 'Total').value;
          const updatedTresorerie = totalPassif - (updatedImmob + updatedAmort + updatedStock + updatedCreances);
          const actif = {
            ...dataMap,
            "Immobilisations" : updatedImmob,
            "Amortissement" : updatedAmort,
            "Stock" : updatedStock,
            "Créances" : updatedCreances,
            "Trésorerie" : updatedTresorerie,
            "Total" : 0,
          }
          actif.Total = Object.values(actif).reduce((sum, value)=> sum + value, 0);
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
        setResults((results) => ({...results, Passif : passif, Actif : actif, Cpc : cpc}))

        setPassifData(passif);
        setActifData(actif);
        setCpcData(cpc);
      } catch (error) {
        console.error("Erreur lors du chargement des rapports:", error.message);
      } finally {
        setIsLoading(false);
        setResults(results => ({...results, isLoading : false}));

      }
    };

    getAllReports();
  }, []);

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
    { name: "Actif", icon: <FaChartBar />, table: actifTable, data: actifData },
    { name: "Passif", icon: <FaBalanceScale />, table: passifTable, data: passifData },
    { name: "CPC", icon: <FaFileInvoice />, table: cpcTable, data: cpcData },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Search bar */}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement des rapports...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map(({ name, icon, table, data }) => (
              <div
                key={name}
                className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col"
              >
                <div className="flex items-center gap-3 p-4 bg-blue-600 text-white">
                  <span className="text-2xl">{icon}</span>
                  <h2 className="font-bold text-xl">{name}</h2>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
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
                    <tbody className="bg-white divide-y divide-gray-100">
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className={`px-3 py-2 ${
                                typeof cell.getValue() === "number"
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
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Aucun résultat pour {name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default InvesSimulationTable;
