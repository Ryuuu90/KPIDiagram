import React, { useCallback, useEffect, useMemo, useRef, useState, memo, use } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useReactFlow,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Pencil, Play, RotateCcw } from "lucide-react";
import axios from 'axios';
import { motion } from 'framer-motion';
import './KPIDiagram.css'
import LoanCalculator from './loanCalculator'
import Elements from './Elements';
// import finansiaLogo from '../public/finansia-logo.jpeg';
import toast, { Toaster } from "react-hot-toast";
import { isNumeral } from 'numeral';
import { useDeepCompareMemo, useDeepCompareEffect } from 'use-deep-compare';
import { FaBalanceScale, FaChartBar, FaLeaf, FaFileInvoice } from "react-icons/fa";
import calculateResults from './loanCalculator';



import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';


const URL = process.env.REACT_APP_BACKEND_URL;


const AffectedElementsTable = ({ Source, expandedNodes, setSource, reset, simulate }) => {
  const [baseElements, setBaseElements] = useState([]);
  const [baseSlenght, setBasesLenght] = useState(0);
  const [editingRow, setEditingRow] = useState(null); // track which row is being edited
  const [query, setQuery] = useState("");
  const [isInfluencers, setIsInfluencers] = useState(false);
  const inputRef = useRef(null);
  const affected = {
    'EC041': ['EC048', 'EC157', 'EC073', 'EC139'],
    'EC074': ['EC048', 'EC158', 'EC073', 'EC139'],
    'EC078': ['EC048', 'EC159', 'EC073', 'EC139'],
    'EC080': ['EC048', 'EC160', 'EC073', 'EC139']
  }

  const filtredVals = useRef(null);

  const nodes = [...expandedNodes, Source];





  useDeepCompareEffect(() => {
    const getAffectedElements = async () => {
      try {
        if (nodes.includes(...Object.keys(affected))) {
          filtredVals.current = nodes.filter(key => affected[key] != undefined).map(key => affected[key]).flat();
          const response = await axios.post(`${URL}/api/affected`, { affected: filtredVals.current });
          setBaseElements(response.data.elements)
          setBasesLenght(response.data.elements.length);
        }
      }
      catch (error) {
        console.error(error);
      }
    }

    getAffectedElements();
  }, [nodes, simulate, reset])


  // return(<div>{nodes}</div>)


  const formatNumber = (num) => {
    if (num === "-" || num === "" || num == null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };
  // Handle search (if you type an element name)
  const handleInputFocus = (e) => {
    if (e.code === "Enter") {
      const source = Elements.find(
        (elem) => elem.nameFr.toLowerCase() === query.toLowerCase()
      );
      if (source) setSource(source.id);
    }
  };

  // Fetch data only when Source changes

  const columns = useMemo(
    () => [
      {
        accessorKey: "parentId",
        header: "element ID",
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: "nameFr",
        header: "Le nom de l’élément",
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: "SoldeValue",
        header: "Valeur du solde",
        cell: ({ getValue }) => <span>{formatNumber(getValue())}</span>,
      },
      {
        accessorKey: "newSold",
        header: "Nouveau solde",
        cell: ({ getValue, row }) => {
          const elementId = row.original.parentId;
          const savedValue = filtredVals.current[elementId] || "-";

          return (
            <div className="flex items-center gap-2">
              <>
                <span>{savedValue === '-' && getValue() !== null ? formatNumber(getValue()) : formatNumber(savedValue)}</span>
              </>
            </div>
          );
        },
      },
    ],
    [baseSlenght, simulate, reset]
  );

  const table = useReactTable({
    data: baseElements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    table.setPageSize(baseSlenght);
  }, [baseSlenght]);

  return (
    <div>
      <table className="w-full h-full border border-gray-200">
        {/* HEAD */}
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                // if (header.column.columnDef.header === "element ID") return null;
                return (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        {/* BODY */}
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => {
                  // if (cell.column.columnDef.header === "element ID") return null;
                  return (
                    <td key={cell.id} className="px-4 py-2 text-sm text-gray-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};



const SimulationTable = ({ Source, basesRef, setSource, reset }) => {
  const [baseElements, setBaseElements] = useState([]);
  const [baseSlenght, setBasesLenght] = useState(0);
  const [editingRow, setEditingRow] = useState(null); // track which row is being edited
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);


  // Save value for a specific element
  const handleSave = (elementId) => {
    if (inputRef.current) {
      const val = inputRef.current.value.trim();
      if (elementId === 'EC013' || elementId === 'EC054')
        if (val.length > 12) return;
      basesRef.current[elementId] = val; // save globally
      setEditingRow(null); // close edit mode
    }
  };
  const formatNumber = (num) => {
    if (num === "-" || num === "" || num == null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };
  // Handle search (if you type an element name)
  const handleInputFocus = (e) => {
    if (e.code === "Enter") {
      const source = Elements.find(
        (elem) => elem.nameFr.toLowerCase() === query.toLowerCase()
      );
      if (source) setSource(source.id);
    }
  };

  // Fetch data only when Source changes
  useEffect(() => {
    const getBaseElements = async () => {
      try {
        const result = await axios.post(`${URL}/api/search/`, {
          elementId: Source,
        });
        setBaseElements(result.data.elements);
        setBasesLenght(result.data.elements.length);
      } catch (error) {
        console.log(error);
      }
    };
    getBaseElements();
  }, [Source, reset]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "parentId",
        header: "element ID",
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: "nameFr",
        header: "Le nom de l’élément",
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: "SoldeValue",
        header: "Valeur du solde",
        cell: ({ getValue }) => <span>{formatNumber(getValue())}</span>,
      },
      {
        accessorKey: "newSold",
        header: "Nouveau solde",
        cell: ({ getValue, row }) => {
          const elementId = row.original.parentId;
          const savedValue = basesRef.current[elementId] || "-";

          return (
            <div className="flex items-center gap-2">
              {editingRow === elementId ? (
                <input
                  type="number"
                  defaultValue={savedValue === "-" ? "" : savedValue}
                  ref={inputRef}
                  onBlur={() => handleSave(elementId)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave(elementId)}
                  className="w-24 text-xs text-gray-800 border border-gray-300 rounded px-1"
                  autoFocus
                />
              ) : (
                <>
                  <span>{savedValue === '-' && getValue() !== null ? formatNumber(getValue()) : formatNumber(savedValue)}</span>
                  <button onClick={() => setEditingRow(elementId)}>
                    <Pencil
                      size={14}
                      className="text-gray-500 hover:text-gray-700"
                    />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [editingRow, reset]
  );

  const table = useReactTable({
    data: baseElements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    table.setPageSize(baseSlenght);
  }, [baseSlenght]);

  return (
    <div>
      <table className="w-full h-full border border-gray-200">
        {/* HEAD */}
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                // if (header.column.columnDef.header === "element ID") return null;
                return (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        {/* BODY */}
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => {
                  // if (cell.column.columnDef.header === "element ID") return null;
                  return (
                    <td key={cell.id} className="px-4 py-2 text-sm text-gray-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};





// Mock axios for demo purposes
const TableExample = () => {
  const [allData, setAllData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [reportType, setReportType] = useState('Passif')
  const [isLoading, setIsLoading] = useState(false);
  // const [activeReport, setActiveReport] = useState("CPC");

  // const reports =;
  const reports = [
    { name: "Passif", icon: <FaBalanceScale /> },
    { name: "Actif", icon: <FaChartBar /> },
    { name: "ESG", icon: <FaLeaf /> },
    { name: "CPC", icon: <FaFileInvoice /> },
  ];
  const color = useRef('white');

  // Mock data for demonstration (replace with your actual API call)
  useEffect(() => {
    const getAllData = async () => {
      setIsLoading(true)
      try {
        // console.log(reportType);
        const response = await axios.post(`${URL}/api/reports`, { reportType: reportType });
        setAllData(response.data.report);
        console.log(response.data.report);
      } catch (error) {
        console.error(error.message);
      }
      finally {
        setIsLoading(false)
      }
    }
    getAllData();
  }, [reportType]);

  // Column definitions - FIXED: Changed dependency to [reportType]
  const columns = useMemo(
    () => {
      if (reportType === 'CPC')
        return [{
          accessorKey: 'Nature',
          header: 'Nature',
          cell: ({ getValue }) => {
            const value = getValue();
            return (
              <span className="font-medium text-gray-800">
                {value ? value.trim() : ''}
              </span>
            );
          },
        },
        {
          accessorKey: "Operations propres l'exercice",
          header: "Opérations propres à l'exercice",
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Operations concernant les exercices precedents',
          header: 'Opérations exercices précédents',
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: "TOTAUX DE L'EXERCICE (3 = 2+1)",
          header: "Totaux de l'exercice",
          cell: ({ getValue }) => (
            <span className="font-bold text-indigo-700  px-2 py-1 rounded">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: "Totaux de l'exercice precedent",
          header: "Totaux exercice précédent",
          cell: ({ getValue }) => (
            <span className="font-semibold text-gray-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        }];

      else if (reportType === 'ESG')
        return [{
          accessorKey: 'Definition',
          header: 'Definition',
          cell: ({ getValue }) => (
            <span className="font-medium text-gray-800">
              {getValue()}
            </span>
          ),
        },
        {
          accessorKey: "Exercice",
          header: "Exercice",
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Exercice Precedent',
          header: 'Exercice Precedent',
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        }];

      else if (reportType === 'Actif')
        return [{
          accessorKey: 'Actif',
          header: 'Actif',
          cell: ({ getValue }) => (
            <span className="font-medium text-gray-800">
              {getValue()}
            </span>
          ),
        },
        {
          id: "exercice-brut",
          accessorFn: (row) => row.Exercice?.Brut || 0,
          header: "Brut",
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          id: "exercice-amortissements",
          accessorFn: (row) => row.Exercice?.['Amortissements et provisions'] || 0,
          header: 'Amortissements et provisions',
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          id: "exercice-net",
          accessorFn: (row) => row.Exercice?.['Net'] || 0,
          header: 'Net Exercice',
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Exercice Precedent',
          header: 'Exercice Precedent',
          cell: ({ getValue }) => {
            const value = getValue() || 0;
            return (
              <span className="font-semibold text-blue-600">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'MAD'
                }).format(value)}
              </span>
            );
          },
        }];

      else if (reportType === 'Passif')
        return [{
          accessorKey: 'Passif',
          header: 'Passif',
          cell: ({ getValue }) => (
            <span className="font-medium text-gray-800">
              {getValue()}
            </span>
          ),
        },
        {
          accessorKey: "Exercice",
          header: "Exercice",
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Exercice Precedent',
          header: 'Exercice Precedent',
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'MAD'
              }).format(getValue())}
            </span>
          ),
        }];

      return []; // fallback
    },
    [reportType] // FIXED: Changed from [allData] to [reportType]
  );

  const table = useReactTable({
    data: allData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize: allData.length, // <<< هذا يضمن عرض جميع الصفوف
      },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex gap-4 p-4 h-44 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl">
            {reports.map(({ name, icon }) => {
              const isActive = reportType === name;
              return (
                <div
                  key={name}
                  onClick={() => setReportType(name)}
                  className={`
                    cursor-pointer relative flex flex-col justify-between rounded-2xl 
                    transition-all duration-700 transform overflow-hidden
                    ${isActive
                      ? "flex-[2] scale-100 bg-white/20 backdrop-blur-md text-white border border-white/30"
                      : "flex-1 bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:scale-105 border border-white/10"}
                  `}
                >
                  <div className="relative p-6 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-4 text-2xl">
                      <span className={`${isActive ? "text-orange-200" : "text-white/60"} transition-colors duration-300`}>
                        {icon}
                      </span>
                      <h2 className={`font-bold text-xl transition-colors duration-300 ${isActive ? "text-white text-3xl" : "text-white"}`}>
                        {name}
                      </h2>
                    </div>
                    <p className={`text-sm transition-colors duration-300 ${isActive ? "text-orange-50 duration-800 text-base" : "text-white/40"} `}>
                      {name === 'ESG' ? "Tableau des comptes de produits et charges" : name === 'CPC' ? "Tableau des comptes de Produits et Charges" : name === 'Passif' ? "Tableau du Passif" : "Tableau de l’Actif"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
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
                  className="w-full pl-10 pr-4 py-2 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
                />
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-600">
                {table.getFilteredRowModel().rows.length} résultat(s)
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="mt-2 text-orange-600 font-medium">Chargement...</p>
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
                  let useGray = true; // toggle state
                  let currentColor = "gray"; // start with gray

                  return table.getRowModel().rows.map((row) => {
                    // check if this row has a Roman numeral in the "Nature" column
                    const natureCell = row.getVisibleCells().find(
                      (cell) => cell.column.columnDef.header === "Nature" || cell.column.columnDef.header === "Definition"
                        || cell.column.columnDef.header === "Actif" || cell.column.columnDef.header === "Passif"
                    );
                    // console.log(row);
                    if (reportType === "CPC" && natureCell) {
                      const cellValue = natureCell.getValue();
                      if (cellValue && typeof cellValue === 'string') {
                        const roman = cellValue.trim().split(".")[0];
                        if (/^[IVXLCDM]+$/.test(roman)) {
                          useGray = !useGray;
                          currentColor = useGray ? "gray" : "orange";
                        }
                      }
                    }
                    if (reportType === 'ESG' && natureCell) {
                      if (natureCell.getValue() === "I. Tableau de formation des R;sultats (T.F.R )")
                        currentColor = "gray";
                      else if (natureCell.getValue() === "II. CAPACITE D'AUTOFINANCEMENT (C.A.F.) - AUTOFINANCEMENT")
                        currentColor = "orange"
                    }
                    if (reportType === 'Actif' && natureCell) {
                      if (natureCell.getValue() === "IMMOBILISATIONS EN NON VALEUR (A)" || natureCell.getValue() === "IMMOBILISATIONS CORPORELLES (C)" || natureCell.getValue() === "ECARTS DE CONVERSION - ACTIF (E)"
                        || natureCell.getValue() === "CREANCES DE L'ACTIF CIRCULANT (G)" || natureCell.getValue() === "ECARTS DE CONVERSION - ACTIF (I)")
                        currentColor = "gray";
                      else if (natureCell.getValue() === "IMMOBILISATIONS INCORPORELLES (B)" || natureCell.getValue() === "IMMOBILISATIONS FINANCIERES (D)" || natureCell.getValue() === "STOCKS (F)"
                        || natureCell.getValue() === "TITRES ET VALEURS DE PLACEMENT (H)" || natureCell.getValue() === "TRESORIE ACTIF")
                        currentColor = "orange"
                    }
                    if (reportType === 'Passif' && natureCell) {
                      if (natureCell.getValue() === "CAPITAUX PROPRES" || natureCell.getValue() === "DETTES DE FINANCEMENT" || natureCell.getValue() === "ECARTS DE CONVERSION PASSIF"
                        || natureCell.getValue() === "AUTRES PROVISIONS POUR RISQUE ET CHARGE            (G)")
                        currentColor = "gray";
                      else if (natureCell.getValue() === "CAPITAUX PROPRES ASSIMILES" || natureCell.getValue() === "PROVISIONS DURABLES POUR RISQUES ET CHARGE" || natureCell.getValue() === "DETTES DU PASSIF CIRCULANT "
                        || natureCell.getValue() === "TITRES ET VALEURS DE PLACEMENT (H)" || natureCell.getValue() === "TRESORIE - PASSIF")
                        currentColor = "orange"
                    }

                    // two fixed Tailwind classes
                    const bgClassMap = {
                      gray: "bg-gray-50 hover:bg-gray-200",
                      orange: "bg-orange-50 hover:bg-orange-200",
                    };

                    const rowBgClass = bgClassMap[currentColor];

                    return (
                      <tr key={row.id} className={`transition-colors ${rowBgClass}`}>
                        {row.getVisibleCells().map((cell) => {
                          const value = cell.getValue();
                          const isNumeric = typeof value === "number" || value === null;

                          return (
                            <td
                              key={cell.id}
                              className={`px-4 py-3 text-sm border-b border-gray-100 ${isNumeric ? "text-right" : "text-left"
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
  );
};
const HoverNode = ({ data }) => (
  <div className={`tooltip-box bg-gradient-to-br from-orange-400 to-orange-500 border border-orange-300/30 shadow-2xl`}>
    {/* <div className="font-semibold text-amber-400 mb-1">nodeID: {data.id}</div> */}
    <div className="text-white font-semibold mb-3 "><span className={`font-bold text-gray-600  "}`}>Interprétation</span> : {data.interpretation}</div>
    <div className="text-white font-semibold mb-3"><span className={`font-bold text-gray-600 "}`}>Recommandations</span> : {data.recommandations}</div>
    <div className="text-white font-semibold"><span className={`font-bold text-gray-600 "}`}>Exemple</span> : {data.example}</div>
  </div>
);

const CollapsibleField = ({ label, value, isFirst, modelType, category, newSold }) => {
  const isReactNode = React.isValidElement(value);

  const isObject = value && typeof value === "object" && !isReactNode;
  if (isReactNode && value.props.children[1].includes("undefined"))
    return
  if (value === undefined || value === null) return;
  return (
    <div className={`mb-2 ${isFirst ? "border-r pr-5 mr-3" : ""} border-orange-100`}>
      <div
        className={`flex items-center justify-between cursor-pointer text-xs font-bold ${modelType === "ratio" ? "text-amber-600" : "text-orange-600"}`}
      >
        <span>{label}:</span>
      </div>

      {isReactNode && (
        <div className="text-xs text-gray-800 break-words mt-1">
          {value}
        </div>
      )}
      {!isReactNode && !isObject && label !== "Valeur du solde" && label !== "Nouveau solde" && label !== "Écart du solde" && (
        <div className="text-xs text-gray-800 break-words mt-1">{String(value)}</div>
      )}
      {!isReactNode && !isObject && (label === "Valeur du solde" || label === "Nouveau solde" || label === "Écart du solde") && (
        <div className="text-xs font-extrabold text-black break-words mt-1">{String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
      )}

    </div>
  );
};

const SimulationCard = memo(({ data, basesRef, modelType, cardRef }) => {
  const [Clicked, setClicked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  const [editingSold, setEditingSold] = useState(false)
  const [value, setValue] = useState("-");
  const inputRef = useRef(null);

  const handleSave = () => {
    // console.log(inputRef.current.value)
    if (inputRef.current) {
      const val = inputRef.current.value;
      if (val.length > 12)
        return;
      basesRef.current[data.parentId] = val.trim();
      setEditing(false)
      setEditingSold(true)
      setValue(val);
    }
  };

  const fields = [
    {
      label: 'Designation',
      value: data.nameFr
    },
    { label: 'Valeur du solde', value: data.SoldeValue, },
    { label: 'Nouveau solde', value: data.newSold !== null ? data.newSold : '-' },
    { label: "la formule de calcul", value: data.formula }
  ];


  const getFiltredItemms = () => {

    if (!query)
      return [];
    return Elements.filter(elem => elem.nameFr.toLowerCase().includes(query.toLowerCase()));
  }

  const filteredData = getFiltredItemms();
  // console.log(filteredData);

  const handleInputFocus = (e) => {

    if (e.code === 'Enter') {
      const source = Elements.find(elem => elem.nameFr.toLowerCase() === query.toLowerCase());
      if (!source)
        return;
      else {
        // console.log(source.id);
        data.setSource(source.id);
      }
    }
  }

  return (
    <motion.div
      onMouseLeave={() => setClicked(false)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      ref={cardRef}
      className={`relative ${data.eleType === "Source" ? "w-[250px] grid grid-cols-1" : "w-[330px] grid grid-cols-2"}  bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans `}
    >
      {data.isRoot && (
        <div className={` ${data.eleType === 'Source' ? "relative" : "absolute w-[20.5rem] -top-[3.67rem]"} z-10`}>
          <input
            type='text'
            className='w-full border border-gray-400 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
            placeholder="Recherchez un élément"
            onKeyDown={handleInputFocus}
          />
          {filteredData.length > 0 && (
            <ul
              className='search-dropdown'
            >
              {filteredData.map((val, i) => (
                <li
                  key={val.nameFr + i}
                  className='px-3 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 cursor-pointer transition-colors duration-150 text-gray-800'
                  onClick={() => { data.setSource(val.id); data.Selected.current = true }}>
                  {val.nameFr}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* {data.Type === "Source" && (<select className='w-14' value={data.Source} onChange={(e) => {data.setSource(e.target.value)}}>
      {['Rind', 'Rges', 'Rliq', 'Rend', 'Rsol', 'Rren'].map(key => 
            <option key={key} value={key}>{key}</option>)}
    </select>)} */}
      <Handle type="target" position={Position.Left} className="opacity-0" />

      {data.eleType !== "Source" && (
        <div className={`absolute ${data.eleType === "Ratio" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-orange-500 to-orange-600"} text-white -top-[0.9rem] right-1/2 w-full text-xl font-bold rounded-lg text-center transform -translate-y-1/2 translate-x-1/2 shadow-sm`}>
          {data.parentId}
        </div>
      )}
      {data.eleType !== "Source" && data.interpretation && data.recommandations && data.example && (<button className='absolute right-2 top-2 bg-orange-100 text-orange-700 hover:bg-orange-200 w-10 rounded-md h-6 text-center text-xs font-semibold transition-colors' onClick={() => setClicked(true)}>info</button>)}
      {Clicked && (
        <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
          <HoverNode data={data} />
          <div className="tooltip-arrow" />
        </div>
      )}

      {data.eleType !== "Source" && (fields.map((field, idx) => {
        if (field.label !== "Nouveau solde")
          return (<div key={idx} className='row-span-2'>
            <CollapsibleField label={field.label} value={field.value} isFirst={idx === 0 || idx === 3} modelType={modelType} category={data.category} newSold={data.newSold} />
          </div>)
      }))}

      {editing && data.category === "Elément de base" ? (
        <div className="flex flex-col cursor-pointer text-xs font-bold text-blue-600">
          <span>Nouveau solde:</span>
          <input
            type="number"
            defaultValue=""
            ref={inputRef}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-24 mt-1 text-xs text-gray-800 border border-gray-300 rounded px-1"
            autoFocus
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col cursor-pointer text-xs font-bold text-blue-600">
            {data.eleType !== "Source" && (<CollapsibleField label={fields[2].label} value={data.category === "Elément de base" && (data.newSold === null || editingSold) ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : fields[2].value} isFirst={false} modelType={modelType} category={data.category} newSold={data.newSold} />)}
            {data.category === "Elément de base" && (<button onClick={() => { setEditing(true) }}>
              <Pencil size={14} className="absolute bottom-11 right-10 text-gray-500 hover:text-gray-700" />
            </button>)}
          </div>
        </>
      )}

      {data.eleType !== "Source" && (<CollapsibleField label={"Var du solde"} value={((fields[2].value / fields[1].value) - 1).toFixed(3) !== 'NaN' && fields[1].value !== 0 && fields[2].value !== null ? Number((((fields[2].value / fields[1].value) - 1) * 100).toFixed(3)).toString() + '%' : "-"} isFirst={false} modelType={modelType} category={data.category} newSold={data.newSold} />)}

      {data.eleType === "Source" && (<div className="text-base text-gray-700">{data.label}</div>)}
      {/* {data.eleType !== "Ratio" && (<div className={`absolute ${data.sign === '+' ? 'bg-green-300' : 'bg-red-300'}  top-1/2 left-[-1.5rem] w-6 rounded-full text-center transform -translate-y-1/2`}>{data.sign}</div>)} */}
      {data.hasChildren && (
        <button
          onClick={data.onDrill}
          className="absolute bottom-2 right-2 text-sm bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg px-3 py-1 font-medium transition-all shadow-sm"
        >
          {data.expanded ? "−" : `${data.childrenNum} +`}
        </button>
      )}

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </motion.div>
  );
});

const CustomNode = memo(({ data, basesRef, modelType }) => {
  const [Clicked, setClicked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const SourceArrays = { "ratio": ['Rind', 'Rges', 'Rliq', 'Rend', 'Rsol', 'Rren'], "élément comptable": ['ECBA', 'ECBP', 'ECPC', 'ESG'] };

  const fields = [
    {
      label: 'Designation',
      value: (
        <>
          <span className="font-semibold">{data.nameFr}</span>
          {` : ${data.signification}`}
        </>
      )
    },
    { label: 'Méthode de calcul', value: data.method },
    { label: 'Rapports contenant item', value: data.Reports },
    { label: 'Valeur du solde', value: String(data.SoldeValue).replace(/\B(?=(\d{3})+(?!\d))/g, "."), }
  ];


  return (
    <motion.div
      onMouseLeave={() => setClicked(false)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative ${data.eleType === "Source" ? "w-[250px]" : "w-[520px] grid grid-cols-2 "} bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans `}
    >
      {data.eleType === "Source" && (<select value={data.Source || ""} onChange={(e) => { data.setSource(e.target.value); data.Selected.current = true }}>
        <option value="" disabled>{data.SelectTitle}</option>
        {SourceArrays[modelType].map(key => {
          const element = Elements.find(elem => elem.id === key)
          return (<option key={key} value={key}>{element.nameFr}</option>)
        })}
      </select>)}
      <Handle type="target" position={Position.Left} className="opacity-0" />

      <div className={`absolute ${data.eleType === "Ratio" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-blue-600"} text-white -top-[0.9rem] right-1/2 w-20 text-xl font-bold rounded-lg text-center transform -translate-y-1/2 translate-x-1/2 shadow-sm`}>
        {data.parentId}
      </div>
      {data.eleType !== "Source" && data.interpretation && data.recommandations && data.example && (<button className='absolute right-2 top-2 bg-orange-100 text-orange-700 hover:bg-orange-200 w-10 rounded-md h-6 text-center text-xs font-semibold transition-colors' onClick={() => setClicked(true)}>info</button>)}
      {Clicked && (
        <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
          <HoverNode data={data} />
          <div className="tooltip-arrow" />
        </div>
      )}

      {data.eleType !== "Source" && (fields.map((field, idx) => {
        const isLast = idx === fields.length - 1;

        return (
          <div key={idx} className={idx === 0 && fields[1]?.value?.length < 2 * fields[0]?.value?.props?.children[1]?.length / 3 ? "row-span-3" : ""}>
            <CollapsibleField label={field.label} value={field.value} isFirst={idx === 0} modelType={modelType} category={data.category} newSold={data.newSold} />
          </div>
        );
      }))}

      {/* <div className="text-base text-gray-700">{data.label}</div> */}
      {data.hasChildren && (
        <button
          onClick={data.onDrill}
          className="absolute bottom-2 right-2 text-sm bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg px-3 py-1 font-medium transition-all shadow-sm"
        >
          {data.expanded ? "−" : `${data.childrenNum} +`}
        </button>
      )}

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </motion.div>
  );
});

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2 }
};

const KPIDiagram = ({ initialMode }) => {
  const [Source, setSource] = useState('');
  const [SourceTable, setSourceTable] = useState('');
  const [reset, setReset] = useState(false);
  const [Simulate, setSimulate] = useState(false);
  const [isOpenAffected, setIsOpenAffected] = useState(false);
  const tableRef = useRef(null);
  const cardRef = useRef(null);
  const [tableCoords, setTableCoords] = useState({ x: 0, y: 0, width: 0 });
  const SelectTitle = useRef('');
  const Selected = useRef(false);
  const lastPrentId = useRef({ "simulation": '', "ratio": '', "élément comptable": '' })
  const [level, setLevel] = useState(0);
  const newNodesRef = useRef({ "simulation": [], "ratio": [], "élément comptable": [] });
  const edgesRef = useRef({ "simulation": [], "ratio": [], "élément comptable": [] });
  const expandedNodesRef = useRef({ "simulation": new Set(), "ratio": new Set(), "élément comptable": new Set() });
  // NEW: Add expanded nodes array to track and send to API
  const expandedNodesArrayRef = useRef({ "simulation": [], "ratio": [], "élément comptable": [] });
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);
  const basesRef = useRef({});
  const [baseElements, setBaseElements] = useState([]);
  const chilLimit = useRef('');
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState(initialMode || "simulation");
  const [isOpen, setIsOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (initialMode) {
      const mode = initialMode.toLowerCase();
      setModelType(mode);
      setSource('');
      Selected.current = true; // Trigger data reset for new mode

      if (mode === "élément comptable") {
        SelectTitle.current = 'Sélectionnez un rapport';
      } else {
        SelectTitle.current = 'Sélectionnez une famille';
      }
    }
  }, [initialMode]);

  const nodeTypes = useMemo(() => ({
    customNode: (props) => {
      if (modelType === "simulation") {
        return <SimulationCard {...props} basesRef={basesRef} modelType={modelType} cardRef={cardRef} />;
      } else {
        return <CustomNode {...props} basesRef={basesRef} modelType={modelType} />;
      }
    }
  }), [basesRef, modelType]);

  //  useEffect( ()=>{

  //     const saveToDb = async ()=>{
  //       try{
  //         const result = await axios.get(`${URL}/api/data2/`);
  //         console.log(result);
  //       }
  //       catch (error)
  //       {
  //         console.log(error);
  //       }
  //     } 
  //     saveToDb();

  // }, [])
  // Enhanced tree layout positioning algorithm
  const calculateTreeLayout = useCallback(() => {
    const nodeMap = new Map(newNodesRef.current[modelType].map(node => [node.id, node]));
    const visitedNodes = new Set();
    const horizontalSpacing = modelType !== "simulation" ? 700 : 500;
    const verticalSpacing = modelType !== "simulation" ? 350 : 250;

    const positionSubtree = (nodeId, x, y, level = 0) => {
      if (visitedNodes.has(nodeId)) return { width: 0, height: 0 };

      const node = nodeMap.get(nodeId);
      if (!node) return { width: 0, height: 0 };

      visitedNodes.add(nodeId);

      // Get children of this node
      const children = edgesRef.current[modelType]
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target)
        .filter(childId => nodeMap.has(childId));

      if (children.length === 0) {
        // Leaf node
        node.position = { x, y };
        return { width: horizontalSpacing, height: verticalSpacing };
      }

      // Calculate positions for children
      let totalChildHeight = 0;
      const childHeights = [];

      // First pass: calculate how much space each child subtree needs
      for (const childId of children) {
        const childHeight = positionSubtree(childId, x + horizontalSpacing, y + totalChildHeight, level + 1);
        childHeights.push(childHeight.height);
        totalChildHeight += childHeight.height;
      }

      // Position the parent node in the center of its children
      const parentY = y + (totalChildHeight - verticalSpacing) / 2;
      node.position = { x, y: parentY };

      return { width: horizontalSpacing, height: Math.max(totalChildHeight, verticalSpacing) };
    };

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = newNodesRef.current[modelType].filter(node =>
      !edgesRef.current[modelType].some(edge => edge.target === node.id)
    );

    let currentY = 0;
    rootNodes.forEach(rootNode => {
      const subtreeSize = positionSubtree(rootNode.id, 50, currentY, 0);
      currentY += subtreeSize.height + 100; // Add spacing between root trees
    });
  }, [modelType]);

  // Enhanced camera positioning function
  const focusOnNodeAndChildren = useCallback((parentNodeId) => {
    if (!reactFlowInstance.current) return;

    const parentNode = newNodesRef.current[modelType].find(n => n.id === parentNodeId);
    if (!parentNode) return;
    console.log(parentNode);
    if (parentNode.data.eleType === 'Source' && !parentNode.data.expanded) {
      reactFlowInstance.current.fitView({
        padding: 0.4,
        includeHiddenNodes: false,
        maxZoom: 2,
        duration: 800
      });
      return;
    }

    // Get all children nodes
    const childrenIds = edgesRef.current[modelType]
      .filter(edge => edge.source === parentNodeId)
      .map(edge => edge.target);

    const childrenNodes = newNodesRef.current[modelType].filter(n => childrenIds.includes(n.id));
    const allNodes = [parentNode, ...childrenNodes];

    if (allNodes.length === 0) return;

    // Calculate bounding box of parent and all children
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    allNodes.forEach(node => {
      const nodeWidth = modelType === "simulation" ? 300 : 400;
      const nodeHeight = modelType === "simulation" ? 200 : 250;

      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add padding around the bounding box
    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Calculate the center and dimensions
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    // Get viewport dimensions
    const viewportWidth = reactFlowWrapper.current.clientWidth;
    const viewportHeight = reactFlowWrapper.current.clientHeight;

    // Calculate zoom to fit all nodes with some padding
    const zoomX = viewportWidth / width;
    const zoomY = viewportHeight / height;
    const zoom = Math.min(zoomX, zoomY, 1.5); // Cap at 1.5x zoom

    // Calculate viewport position to center the nodes
    const x = viewportWidth / 2 - centerX * zoom;
    const y = viewportHeight / 2 - centerY * zoom;

    // Animate to the new viewport
    reactFlowInstance.current.setViewport(
      { x, y, zoom },
      { duration: 800 }
    );
  }, [modelType]);

  // MODIFIED: fetchNode function to include expandedNodes
  const fetchNode = async (nodeId, modelType, basesRef, expandedNodes = []) => {
    try {
      const res = await axios.post(`${URL}/api/node2/${nodeId}`, {
        modelType: modelType,
        basesRef: basesRef.current,
        expandedNodes: expandedNodes  // NEW: Send expanded nodes array
      });
      return res.data.node;
    } catch (error) {
      console.error('Error fetching node:', error);
      return null;
    }
  };

  const fetchCalculation = async (basesRef, expandedNodes = []) => {
    try {
      const expandedArray = expandedNodes.map(node => node.trim())
      const res = await axios.post(`${URL}/api/calculation`, {
        // modelType: modelType, 
        basesRef: basesRef.current,
        expandedNodes: expandedArray  // NEW: Send expanded nodes array
      });
      return res.data;
    } catch (err) {
      if (err.response) {
        // Backend responded with a 4xx or 5xx
        console.error("Error fetching node:", err.response.data);
        toast.error(err.response.data.message || "Une erreur est survenue");
      } else {
        // Network or other error
        console.error("Unexpected error:", err);
        toast.error("Erreur de connexion au serveur");
      }

      setLoading(false)
      return null;
    }
  };

  // MODIFIED: removeDescendants function to also remove from expandedNodesArrayRef
  const removeDescendants = useCallback((parentId) => {
    const toRemove = new Set();
    const stack = [parentId];

    while (stack.length > 0) {
      const current = stack.pop();
      const children = edgesRef.current[modelType]
        .filter(e => e.source === current)
        .map(e => e.target);

      for (const childId of children) {
        // Check if this child has other parents that are not being removed
        const otherParents = edgesRef.current[modelType].filter(
          e => e.target === childId && e.source !== current
        );

        // Filter out parents that are descendants of the current removal
        const validParents = otherParents.filter(par => {
          let source = par.source;
          while (source) {
            const parentEdge = edgesRef.current[modelType].find(e => e.target === source);
            if (!parentEdge) return true;
            if (source === current || toRemove.has(source)) return false;
            source = parentEdge.source;
          }
          return true;
        });

        if (validParents.length === 0) {
          stack.push(childId);
          toRemove.add(childId);
        }
      }
    }

    // Remove nodes and edges
    newNodesRef.current[modelType] = newNodesRef.current[modelType].filter(n => !toRemove.has(n.id));
    edgesRef.current[modelType] = edgesRef.current[modelType].filter(
      e => !toRemove.has(e.source) && !toRemove.has(e.target)
    );

    // Update parent node state
    expandedNodesRef.current[modelType].delete(parentId);

    // NEW: Remove from expandedNodesArrayRef
    expandedNodesArrayRef.current[modelType] = expandedNodesArrayRef.current[modelType].filter(nodeId => nodeId !== parentId);
    // console.log('Updated expanded nodes array:', expandedNodesArrayRef.current);

    newNodesRef.current[modelType] = newNodesRef.current[modelType].map(n =>
      n.id === parentId ? { ...n, data: { ...n.data, expanded: false } } : n
    );

    // Recalculate layout
    calculateTreeLayout();
  }, [calculateTreeLayout]);

  // MODIFIED: handleDrill function to include expandedNodes in fetchNode calls
  const handleDrill = useCallback(
    async (nodeId, isRoot = false, modelType, basesRef) => {
      const isExpanded = expandedNodesRef.current[modelType].has(nodeId);
      if (isExpanded) {
        console.log(newNodesRef.current[modelType]);
        removeDescendants(nodeId);
        setNodes([...newNodesRef.current[modelType]]);
        setEdges([...edgesRef.current[modelType]]);

        // Focus on the collapsed parent node
        setTimeout(() => {
          focusOnNodeAndChildren(nodeId);
        }, 100);

        return;
      }

      // NEW: Pass the current expanded nodes array to fetchNode


      const node = await fetchNode(nodeId, modelType, basesRef, expandedNodesArrayRef.current[modelType]);
      if (!node || !node.childrenData || chilLimit.current.includes(node.parentId)) return;

      const entries = Object.entries(node.childrenData);

      function generateColorFromId(id) {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          hash = ((hash << 5) - hash) + id.charCodeAt(i);
          hash = hash & hash;
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 60%)`;
      }

      // Add children nodes and edges
      entries.forEach(([childId, childLabel], index) => {
        edgesRef.current[modelType].push({
          id: `e-${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          style: {
            stroke: generateColorFromId(nodeId),
            strokeWidth: 2,
          },
          animated: false
        });

        newNodesRef.current[modelType].push({
          id: childId,
          type: 'customNode',
          position: { x: 0, y: 0 }, // Will be calculated by layout
          data: {
            id: childId,
            ...childLabel,
            sign: childLabel.childSign,
            expanded: false,
            onDrill: () => handleDrill(childId, false, modelType, basesRef),
            Source,
            setSource,
            Selected,
          },
        });
      });

      expandedNodesRef.current[modelType].add(nodeId);
      // console.log(node.childrenIds);

      if (!expandedNodesArrayRef.current[modelType].includes(node.childrenIds)) {
        expandedNodesArrayRef.current[modelType].push(...node.childrenIds);
        // console.log('Added to expanded nodes array:', nodeId);
        // console.log('Current expanded nodes array:', expandedNodesArrayRef.current);
      }
      // NEW: Add to expandedNodesArrayRef if not already present

      newNodesRef.current[modelType] = newNodesRef.current[modelType].map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, expanded: true } }
          : n
      );

      // Calculate new layout
      calculateTreeLayout();

      const uniqueNodes = Array.from(new Map(newNodesRef.current[modelType].map((n) => [n.id, n])).values());
      const uniqueEdges = Array.from(new Map(edgesRef.current[modelType].map((e) => [e.id, e])).values());

      setNodes(uniqueNodes);
      setEdges(uniqueEdges);

      // Focus camera on the expanded parent and its children
      setTimeout(() => {
        focusOnNodeAndChildren(nodeId);
        lastPrentId.current[modelType] = nodeId;
      }, 100);
    },
    [level, calculateTreeLayout, removeDescendants, Source, focusOnNodeAndChildren]
  );

  const onInit = useCallback((rfi) => {
    reactFlowInstance.current = rfi;
  }, []);

  // MODIFIED: simulate function to include expandedNodes
  const simulate = async () => {
    setLoading(true);
    const updatedNodes = [];
    // for (let node of newNodesRef.current) {
    const calculation = await fetchCalculation(basesRef, expandedNodesArrayRef.current[modelType]);
    // console.log(calculation)
    if (!calculation) {
      setLoading(false);
      return;
    }
    if (calculation.success) {
      for (let i = 0; i < newNodesRef.current[modelType].length; i++) {
        const node = newNodesRef.current[modelType][i];
        const newNode = await fetchNode(node.id, modelType, basesRef);

        // update the node in place
        newNodesRef.current[modelType][i] = {
          ...node,
          position: node.position,
          data: { ...node.data, ...newNode }
        };
      }

      // then update state with the ref content
      setNodes([...newNodesRef.current[modelType]]);

    }
    setSimulate(!Simulate);
    // else
    // {
    //   toast.error(calculation.message);
    // }
    setReset(false)
    setLoading(false);
  };

  // MODIFIED: handleReset function to clear expandedNodesArrayRef
  const handleReset = async () => {
    try {
      await axios.get(`${URL}/api/reset/`);
      basesRef.current = {};
      expandedNodesArrayRef.current[modelType] = [];
      newNodesRef.current[modelType] = [];
      edgesRef.current[modelType] = [];// NEW: Clear expanded nodes array
      expandedNodesRef.current[modelType].clear();
      setEdges([]);
      setNodes([]);
      setReset(true);
      setIsOpen(false);

      // console.log('Reset - cleared expanded nodes array');
      loadRoot(true);
    } catch (error) {
      console.error(error.message);
    }
  };


  useEffect(() => {
    if (modelType === 'simulation' && Source)
      setSourceTable(Source)
  }, [Source])
  // MODIFIED: loadRoot function to clear expandedNodesArrayRef and include it in fetchNode
  const loadRoot = async (restart = false) => {
    // newNodesRef.current = [];
    // edgesRef.current = [];
    // expandedNodesRef.current[modelType].clear();
    // expandedNodesArrayRef.current = []; // NEW: Clear expanded nodes array

    if (!Source) {
      if (!newNodesRef.current[modelType].length) {
        newNodesRef.current[modelType].push({
          id: 'firstNode',
          type: 'customNode',
          position: { x: 50, y: 200 },
          data: {
            id: '',
            Source,
            isRoot: true,
            setSource,
            Selected,
            SelectTitle: SelectTitle.current,
            eleType: 'Source',
          },
        });
      }
      if (newNodesRef.current[modelType].length <= 1) {
        if (reactFlowInstance.current) {
          setTimeout(() => {
            reactFlowInstance.current.fitView({
              padding: 1,
              includeHiddenNodes: false,
              maxZoom: 1.5,
              duration: restart ? 500 : 200
            });
          }, 100);
        }
      }
      setNodes(newNodesRef.current[modelType]);
      setEdges(edgesRef.current[modelType]);


      return;
    }

    const root = await fetchNode(Source, modelType, basesRef, expandedNodesArrayRef.current[modelType]);
    if (!root) return;

    if (root.childrenLimit) {
      chilLimit.current = root.childrenLimit;
    }

    const rootId = root.parentId || Source;
    // console.log(root);

    newNodesRef.current[modelType].push({
      id: rootId,
      type: 'customNode',
      position: { x: 50, y: 200 },
      data: {
        label: root.nameFr || 'Root Node',
        id: rootId,
        hasChildren: true,
        isRoot: true,
        childrenNum: Object.entries(root.childrenData || {}).length,
        expanded: false,
        onDrill: () => handleDrill(rootId, true, modelType, basesRef),
        Source,
        setSource,
        Selected,
        ...root,
      },
    });

    // calculateTreeLayout();

    setNodes([...newNodesRef.current[modelType]]);
    setEdges([...edgesRef.current[modelType]]);

    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({
          padding: 1,
          includeHiddenNodes: false,
          maxZoom: 1.5,
          duration: restart ? 500 : 200
        });
      }, 100);
    }
  };
  useEffect(() => {
    if (tableRef.current) {
      const react = tableRef.current.getBoundingClientRect();
      setTableCoords({ x: react.x, y: react.y, width: react.width });
    }
  }, [isOpen, tableRef])

  useEffect(() => {
    // calculateTreeLayout();
    // if(cardRef.current)
    //   console.log(cardRef.current.getBoundingClientRect());
    if (reactFlowInstance.current && cardRef.current) {
      // setTimeout(() => {
      reactFlowInstance.current.fitView({
        padding: 1,
        includeHiddenNodes: false,
        maxZoom: 1,
        duration: 500
      });
      const { x, y, zoom } = reactFlowInstance.current.getViewport();
      let zoomUse = zoom > 0.6 ? 0.6 : zoom
      reactFlowInstance.current.setViewport({
        x: isOpen ? x + tableCoords.width * zoomUse : x - tableCoords.width * zoomUse,
        y: y,
        zoom: zoom,
      },
        {
          duration: 500
        })
    }
    // calculateTreeLayout();


  }, [isOpen, tableCoords.x, tableCoords.y])

  useEffect(() => {

    setIsOpen(false);

    if (modelType !== "reports" && modelType !== "loan calculator") {
      if (Selected.current) {
        expandedNodesArrayRef.current[modelType] = [];
        newNodesRef.current[modelType] = [];
        edgesRef.current[modelType] = [];// NEW: Clear expanded nodes array
        expandedNodesRef.current[modelType].clear();
        Selected.current = false;
      }
      focusOnNodeAndChildren(lastPrentId.current[modelType]);
      loadRoot();

    }
  }, [Source, modelType]);

  return (
    <div className="relative" style={{ width: '100%', height: 'calc(100vh - 120px)' }} ref={reactFlowWrapper}>
      <Toaster position="top-right" />
      {modelType !== 'reports' && modelType !== "loan calculator" && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          deleteKeyCode={null}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 2.8 }}
          onInit={onInit}
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Background />
          <Controls />

          {/* Mode Selection Bar */}


          {/* Simulation Controls */}
          {modelType === "simulation" && (
            <div className="absolute top-6 right-6 flex gap-4 z-50 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-xl">
              <button
                className='btn-primary flex items-center gap-2'
                onClick={simulate}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                {loading ? 'Simulation...' : 'Simulate'}
              </button>
              <button
                className='btn-danger flex items-center gap-2'
                onClick={handleReset}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          )}
          {modelType === "simulation" && (<> <div className="absolute top-1/4 left-1 flex">
            {/* Toggle button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 bg-orange-500 z-[1000] text-white rounded-r-xl shadow-lg hover:bg-orange-600 transition-all duration-300"
            >
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>


            {/* The table container */}
            <div
              ref={tableRef}
              className={`table-dropdown z-[100] w-5/6 bg-white shadow-lg rounded-l-lg transition-all duration-300 transform  ${isOpen ? "opacity-100 translate-x-0 " : " opacity-0 -translate-x-full"}`}>
              <h3 className="text-xl bg-gradient-to-r from-orange-100 to-orange-200 text-center font-semibold text-gray-700 border-b p-2">Simulation Table</h3>
              <SimulationTable Source={SourceTable} basesRef={basesRef} setSource={setSource} reset={reset} />
              <h3 className="text-xl bg-gradient-to-r from-orange-200 to-orange-300 text-center font-semibold text-gray-700 border-b p-2">Affected Elements Table</h3>
              <AffectedElementsTable Source={SourceTable} expandedNodes={expandedNodesArrayRef.current[modelType]} setSource={setSource} reset={reset} simulate={Simulate} />
            </div>

          </div> </>)}



          {/* NEW: Debug info for expanded nodes (optional - remove in production) */}
          {process.env.REACT_APP_NODE_ENV === 'development' && modelType !== "reports" && modelType !== "loan calculator" && (

            <div className="absolute left-5 bottom-5 bg-black bg-opacity-70 text-white p-3 rounded-md text-xs z-50">
              <div>Expanded Nodes: {expandedNodesArrayRef.current[modelType].length}</div>
              <div>[{expandedNodesArrayRef.current[modelType].join(', ')}]</div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
              <p className="text-white mt-4 text-lg font-medium">Chargement des éléments...</p>
            </div>
          )}

        </ReactFlow>)}
      {modelType === "reports" && (<TableExample />)}
      {modelType === "loan calculator" && (<LoanCalculator />)}

    </div>
  );
};

export default KPIDiagram;