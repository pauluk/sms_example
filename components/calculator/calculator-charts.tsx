import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface CalculatorChartsProps {
    data: {
        letterTotal: number;
        smsTotal: number;
        letterKg: number;
        smsKg: number;
        freeMsgs: number;
        chargeableMsgs: number;
        overheadTotal: number;
        variableTotal: number;
    };
}

export function CalculatorCharts({ data }: CalculatorChartsProps) {
    const costData = {
        labels: ['Letters', 'SMS'],
        datasets: [
            {
                label: '£',
                data: [data.letterTotal, data.smsTotal],
                backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(53, 162, 235, 0.5)'],
                borderColor: ['rgb(255, 99, 132)', 'rgb(53, 162, 235)'],
                borderWidth: 1,
            },
        ],
    };

    const carbonData = {
        labels: ['Letters', 'SMS'],
        datasets: [
            {
                label: 'kgCO2e',
                data: [data.letterKg, data.smsKg],
                backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'],
                borderColor: ['rgb(75, 192, 192)', 'rgb(153, 102, 255)'],
                borderWidth: 1,
            },
        ],
    };

    const smsSplitData = {
        labels: ['Free (allowance)', 'Chargeable'],
        datasets: [
            {
                data: [data.freeMsgs, data.chargeableMsgs],
                backgroundColor: ['rgba(255, 206, 86, 0.5)', 'rgba(255, 99, 132, 0.5)'],
                borderColor: ['rgb(255, 206, 86)', 'rgb(255, 99, 132)'],
                borderWidth: 1,
            },
        ],
    };

    const overheadsData = {
        labels: ['Overheads', 'Variable cost'],
        datasets: [
            {
                data: [data.overheadTotal, Math.max(0, data.variableTotal)],
                backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 159, 64, 0.5)'],
                borderColor: ['rgb(54, 162, 235)', 'rgb(255, 159, 64)'],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const donutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-4 border rounded-xl">
                <div className="font-bold mb-1">Cost comparison</div>
                <div className="text-xs text-muted-foreground mb-4">Total cost by channel (incl. overhead handling)</div>
                <div className="h-[200px]">
                    <Bar data={costData} options={options} />
                </div>
            </div>

            <div className="bg-white p-4 border rounded-xl">
                <div className="font-bold mb-1">Carbon comparison</div>
                <div className="text-xs text-muted-foreground mb-4">kgCO2e by channel (based on your factors)</div>
                <div className="h-[200px]">
                    <Bar data={carbonData} options={options} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 border rounded-xl">
                    <div className="font-bold mb-1">SMS Utilisation</div>
                    <div className="text-xs text-muted-foreground mb-4">Free vs chargeable</div>
                    <div className="h-[200px]">
                        <Doughnut data={smsSplitData} options={donutOptions} />
                    </div>
                </div>
                <div className="bg-white p-4 border rounded-xl">
                    <div className="font-bold mb-1">Overheads share</div>
                    <div className="text-xs text-muted-foreground mb-4">Overheads vs variable</div>
                    <div className="h-[200px]">
                        <Doughnut data={overheadsData} options={donutOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
