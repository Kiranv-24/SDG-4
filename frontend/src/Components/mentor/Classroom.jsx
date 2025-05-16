import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Pencil from '../../assets/pencil.png';
import View from '../../assets/analysis.png';
import Searchbox from '../SearchBox';
import {Bar} from "react-chartjs-2"
import { Line } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

import {Chart as chartjs} from 'chart.js/auto';


const navigationLink=[
    {
        name:'dashboard_check_meetings',
        path:'/mentor/meetings',
        icons:Pencil,
    },
    {
        name:'dashboard_view_test',
        path:'/mentor/my-test',
        icons:Pencil,
    },
    {
        name:'dashboard_discuss_portal',
        path:'user/discuss',
        icons:Pencil,
    },
    {
        name:'dashboard_created_course',
        path:'/mentor/material',
        icons:Pencil,
    },
    {
        name:'dashboard_materials',
        path:'/mentor/material',
        icons:Pencil,   
    },
    {
        name:'dashboard_digital_library',
        path:'/mentor/digital-library',
        icons:Pencil,
    },
    {
        name:'dashboard_reach_news',
        path:'/mentor/meetings',
        icons:Pencil,
    },
    
]
const classReport=[
    
    {
        class:3,
        performance:40,
        color:'red'
    },
    {
        class:4,
        performance:60,
        color:'yellow'
    },
    {
        class:5,
        performance:20,
        color:'red'
    },
   
    {
        class:7,
        performance:60,
        color:'orange'
    },
    
    {
        class:9,
        performance:60,
        color:'orange'
    },
    {
        class:10,
        performance:80,
        color:'green'
    },
   
    {
        class:12,
        performance:10,
        color:'yellow'
    }
]
const class1=[
    
    {
        month:'Jan',
        performance:40,
       
    },{
        month:'Feb',
        performance:20,
       
    },
   
    {
        month:'Mar',
        performance:40,
       
    },
    {
        month:'Apr',
        performance:10,
       
    },
    {
        month:'May',
        performance:30,
       
    },
    {
        month:'Jun',
        performance:90,
       
    },
    {
        month:'Jul',
        performance:10,
       
    },
    {
        month:'Aug',
        performance:40,
       
    },
    {
        month:'Sep',
        performance:20,
       
    },
    {
        month:'Oct',
        performance:80,
       
    },
    {
        month:'Nov',
        performance:60,
       
    },
    {
        month:'Dec',
        performance:40,
       
    }
]

const options = {
    scales: {
      x: {
        grid: {
          display: true,
        },
        ticks: {
          stepSize: 9, // Increase or decrease this value to control grid spacing
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };
const month=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const Classroom = () => {
  const { t } = useTranslation();
  const [chartData,setChartData]=useState({
    labels:classReport.map((data)=>data.class),
    datasets:[{
        label: t("chart_class_performance"),
        data:classReport.map((data)=>data.performance),
        backgroundColor:classReport.map((data)=>data.color),
        
        barPercentage: 0.9
    }]
  })
  const [chartAnalysis,setChartAnalysis]=useState({
    labels: month.map(m => t(`months_${m.toLowerCase()}`)),
    datasets:[{
        label: t("chart_class"),
        data:class1.map((data)=>data.performance),
        borderColour:'red'
        
    }]
})
const [createdTopics,setCreatedTopics]=useState({
    labels: [t("chart_assignments"), t("chart_test"), t("chart_meetings")],
    datasets:[{
        data: [12, 19, 3],
        backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
      ],
        
    }]
})

  return (
    <div className='base-container gap-20 py-[5vh]'>
        <div className='flex-row-center mb-10'>
         
                {navigationLink.map((obj,id)=>(
                    <Link to={obj.path} className='bg-green-200 h-[70px] px-2 gap-2 rounded-md w-[200px] font-comf text-sm flex flex-row justify-between items-center m-2'>
                        <button >
                            <img src={obj.icons} className='w-[50px]'/>
                        </button>
                        {t(obj.name)}
                   </Link>
                ))}
       
        </div>
        <div className='flex-row-between space-x-2 w-full h-[220px]'>
            <div className='w-2/6 h-full bg-slate-300 rounded-lg shadow-md p-5'>
                <Bar data={chartData} options={options} />
            </div>
            <div className='w-2/6 h-full bg-slate-300 rounded-lg shadow-md p-5'>
                <Line data={chartAnalysis} options={options} />
            </div>
            <div className='w-2/6 h-full bg-slate-300 rounded-lg shadow-md p-5'>
                <Doughnut data={createdTopics} options={options} />
            </div>
            
        </div>
        <hr className='my-5'/>
        <div className=''>
            <Searchbox/>
            <div className='flex flex-col justify-center items-center gap-5'>
                {navigationLink.map((obj,id)=>(
                    <div className={`p-5 rounded-lg font-comf  w-5/6 bg-green-200 text-sm flex-row-between`} >

                        <div className=" font-semibold gap-2">
                            <p>{t("class_label")} : 5</p>
                            <p>{t("subject_label")}: {t("subject_environment_science")}</p>
                            <p>{t("students_label")}: 45</p>

                        </div>
                    
                        <div>
                            <p className="text-center flex-col flex justify-center">
                               <b>45%</b>
                               <p>{t("average_label")}</p>
                            </p>
                        
                        </div>
                        <button className=''>
                            <img src={View} className='w-[40px]'/>
                        </button>
                    </div>))}
            </div>
        </div>
    </div>
  )
}

export default Classroom