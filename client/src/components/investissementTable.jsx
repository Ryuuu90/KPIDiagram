import {useState, useEffect, memo, useMemo} from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
  } from '@tanstack/react-table';
import { FaBalanceScale, FaChartBar, FaLeaf, FaFileInvoice } from "react-icons/fa";
import axios from 'axios';
import { Search} from 'lucide-react';



const URL = process.env.REACT_APP_BACKEND_URL;

const InvestissementTable = memo(()=>{
    const [reportType , setReportType] = useState('Passif');
    const [globalFilter, setGlobalFilter] = useState('');
    const [reportData , setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const reports = [
        { name: "Passif", icon: <FaBalanceScale /> },
        { name: "Actif", icon: <FaChartBar /> },
        { name: "CPC", icon: <FaFileInvoice /> },
      ];


    useEffect(()=>{
        const getInvestissementReports = async () =>{
            setIsLoading(true)
            try {
                const response = await axios.post(`${URL}/api/investissment`, {reportType : reportType});
                const report = response.data.report;
                const data = Object.entries(report).map(([key, value]) => ({
                    label: key,
                    value: value }))
                setReportData(data)
                console.log(data);
            }
            catch(error){
                console.error(error.message);
            }
            finally
            {
                setIsLoading(false);
            }
        }
        getInvestissementReports();
        console.log('zbyy')
    }, [reportType]);

    const formatCurrency = (value) => (
        <span className='font-semibold text-green-600'>
          {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) + ' MAD'}
        </span>
      );
    
    const columns = useMemo(()=>[
        {
            accessorKey: "label",
            header: "Label",
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>
          },
          {
            accessorKey: "value",
            header: "Value",
            cell: ({ getValue }) => formatCurrency(getValue())
          }
    ], [reportType])

    const table = useReactTable({
        data : reportData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel : getFilteredRowModel(),
        getPaginationRowModel : getPaginationRowModel(),
        getSortedRowModel : getSortedRowModel(),
        state : {
            globalFilter,
            pagination:{
                pageIndex : 0,
                pageSize : reportData.length,
            }
        },
        onGlobalFilterChange : setGlobalFilter,
    })
    return(
        <div className='p-6 bg-white min-h-screen mt-28'>
            <div className='max-w-7xl mx-auto'>
                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='flex gap-4 p-4 h-44 bg-blue-600 rounded-xl shadow-lg'>
                        {reports.map(({name, icon})=>{
                            const isActive = reportType === name;
                            return(
                                <div key={name} onClick={()=> setReportType(name)} className={`cursor-pointer relative flex flex-col justify-between rounded-xl 
                                transition-all duration-700 transform overflow-hidden ${isActive ? "flex-[2] scale-100 bg-blue-600 text-white" : "flex-[1] bg-white text-gray-800 hover:bg-blue-100 hover:scale-105"}`}>
                                    <div className='relative p-6 flex-col justify-between h-full'>
                                        <div className='flex items-center gap-3 mb-4  text-2xl'>
                                            <span className={`${isActive ? "text-white scale-100" : "text-blue-500"} transition-colors duration-300`}>
                                                {icon}
                                            </span>
                                            <h2 className={`font-bold  transition-colors duration-300 ${isActive ? "text-white text-3xl" : "text-gray-500 text-xl"}`}>
                                                {name}
                                            </h2>
                                        </div>
                                        <p className={`text-sm transition-colors duration-300 ${isActive ? "text-blue-100 duration-800 text-xl " : "text-gray-500"} `}>
                                        {name === 'ESG' ? "État des Soldes de Gestion (ESG)" : name === 'CPC' ? "Tableau des comptes de Produits et Charges" : name === 'Passif' ? "Tableau du Passif" : "Tableau de l’Actif"}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="p-6 border-b bg-gray-50">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                type="text"
                                placeholder="Rechercher dans le tableau..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Results count */}
                            <div className="text-sm text-gray-600">
                                {table.getFilteredRowModel().rows.length} résultat(s)
                            </div>
                        </div>
                    </div>
                    {isLoading && (
                        <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Chargement...</p>
                        </div>
                    )}
                    {!isLoading && (<div className="overflow-x-auto">
                        <table className="w-full">
                        <thead className="bg-gray-100">
                            {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                    </div>
                                </th>
                                ))}
                            </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                            return table.getRowModel().rows.map((row) => {
                                // check if this row has a Roman numeral in the "Nature" column

                                return (
                                <tr key={row.id} className={`transition-colors bg-gray-50 hover:bg-gray-100`}>
                                    {row.getVisibleCells().map((cell) => {
                                    const value = cell.getValue();
                                    const isNumeric = typeof value === "number" || value === null;

                                    return (
                                        <td
                                        key={cell.id}
                                        className={`px-4 py-3 text-sm border-b border-gray-100 ${
                                            isNumeric ? "text-right" : "text-left"
                                        }`}
                                        >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                    })}
                                </tr>
                                );
                            });
                            })()}
                        </tbody>
                        </table>
                    </div>)}

                    {/* Empty state */}
                    {!isLoading && table.getFilteredRowModel().rows.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                        <Search className="mx-auto w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">Aucun résultat trouvé</p>
                        <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

})

export default InvestissementTable;