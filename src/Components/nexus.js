
import React, { memo, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Slider, TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, CircularProgress, useTheme } from '@mui/material';
import MultiRangeSlider, { ChangeResult } from "multi-range-slider-react";
import { styled } from '@mui/system';
import moment from 'moment';
// import { useTimestamps } from '../../hooks/useTimestamp';
// import { useTimestampsInsights } from '../../hooks/useTimestampInsights';
import { fetchDataByTimestamp, fetchFullShipDataUsingBatch, fetchTimestamps, fetchShipsTimestampsAggData, fetchTimestampsForInsights } from '../../api';
import { useLocation, useParams } from 'react-router-dom';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { lineSpinner } from 'ldrs'
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { GlobalStateContext } from '../../context/GlobalStateContext';
import debounce from 'lodash/debounce';
import CircularProgressWithLabel from '../ui-interaction/CircularProgressWithLabel';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useGlobalTime } from '../../context/GlobalTimeContext';
import { useGlobalTheme } from '../../context/GlobalThemeContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'
import _ from 'lodash';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { CookieSharp } from '@mui/icons-material';
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useFullscreen } from "../../context/FullscreenContext";
import './timeSlider.css'
// import { useShipsTimestampsAggData } from '../../hooks/useShipsTimestampsAggData';
import { useGlobalFilterStore } from '../../globalFilterStore';
import Swal from 'sweetalert2';



dayjs.extend(utc);
dayjs.extend(timezone);

// Timezone map
const timeZones = {
  'UTC': 'UTC',
  'IST': 'Asia/Kolkata',
  'EST': 'America/New_York',
  'PST': 'America/Los_Angeles',
  'Local': Intl.DateTimeFormat().resolvedOptions().timeZone
};

// Default values shown


const checkData = (data, value) => {
  return data && value && data.hasOwnProperty(value) && data[value].hasOwnProperty('ec_timestamp_utc');
}

const urlsToFetchByTimestamp = [
  fetchDataByTimestamp
]



const defaultHeatmapSlider = styled(Slider)({
  color: 'transparent',
  height: 25,
  '& .MuiSlider-thumb': {
    height: 20,
    width: 10,
    borderRadius: '8px',
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active': {
      boxShadow: '0 0 8px rgba(0, 0, 0, 0.4)',
      transition: 'box-shadow 0.3s ease',
    },
    '&.Mui-focusVisible': {
      boxShadow: '0 0 10px rgba(128, 128, 128, 0.8)',
      borderRadius: '8px',
    },
  },
  '& .MuiSlider-track': {
    height: 12,
  },
  '& .MuiSlider-rail': {
    height: 12,
    borderRadius: 4,
    opacity: 0.3, // Adjust the opacity to make it darker
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Use a dark color with opacity for transparency
  },
  '& .MuiSlider-mark': {
    height: 8,
    width: 1,
    backgroundColor: 'black',
  },
  '& .MuiSlider-markLabel': {
    marginTop: 13,
    fontSize: '10px',
  },
  '& .MuiSlider-valueLabel': {
    backgroundColor: 'transparent',
    color: '#000',
    fontSize: '12px',
    marginTop: '12px',
    '&::before': {
      display: 'none',
    },
    '& > span': {
      backgroundColor: 'transparent',
    },
  },
});

function getColorFromValue(value, opacity = 1) {
  if (value <= 0.05) {
    return `rgba(0, 255, 0, ${opacity})`; // Green
  } else if (value > 0.05 && value <= 0.4) {
    return `rgba(255, 255, 0, ${opacity})`; // Yellow
  } else {
    return `rgba(255, 0, 0, ${opacity})`; // Red
  }
}


const TimeSlider = ({ toggleFullscreen }) => {

  // Initialize state to the latest timestamp index
  const trackRef = useRef(null);
  const theme = useTheme()
  const { mode } = useGlobalTheme()
  const { isFullscreen, handleToggleFullscreen } = useFullscreen();
  const { startingTime, setStartingTime, UIstartingTime, setUIStartingTime, endingTime, setEndingTime, UIendingTime, setUIEndingTime, timestamp, setTimestamp, UItimestamp, setUITimestamp, selectedTimeFormat, setSelectedTimeFormat, minTimeCaption, setMinTimeCaption, maxTimeCaption, setMaxTimeCaption } = useGlobalTime()
  const { playTimeLine, setPlayTimeLine, paused, setPaused, selectedType, qoeValuesArray, setQoeValuesArray, cirValuesArray, setCirValuesArray, allTimeStamps, setAllTimeStamps, isFetchingCompleted, setIsFetchingCompleted, startTimeStampFromChat, endTimeStampFromChat, setStartTimeStampFromChat, setEndTimeStampFromChat, selectedShip, setSelectedShip, insightTimeColData, setInsightTimeColData } = useContext(GlobalStateContext);
  const [value, setValue] = useState(-1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const location = useLocation();
  const path = location.pathname;
  const [colouredHeatMap, setColouredHeatMap] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState();
  const [fetchProgress, setFetchProgress] = useState(0);
  const [tempStartingTime, setTempStartingTime] = useState(startingTime);
  const [tempEndingTime, setTempEndingTime] = useState(endingTime);
  const [isStartingTimeOpen, setIsStartingTimeOpen] = useState(false);
  const [isEndingTimeOpen, setIsEndingTimeOpen] = useState(false);
  const [isStartingTimeOpenedOnce, setIsStartingTimeOpenedOnce] = useState(false)
  const [isEndingTimeOpenedOnce, setIsEndingTimeOpenedOnce] = useState(false)
  const [isStartingOkDisabled, setIsStartingOkDisabled] = useState(true);
  const [isEndingOkDisabled, setIsEndingOkDisabled] = useState(true);
  const [ isChangedBoth, setIsChangedBoth ] = useState(true)
  
  const [allTimestampsData, setAllTimestampsData] = useState([])
  const [allShipsTimestampsAggData, setAllShipsTimestampsAggData] = useState([])
  const [allTimestampsDataInsights, setAllTimestampsDataInsights] = useState([])

  const [demandValuesArray, setDemandValuesArray] = useState();
  const [bwdUtilValuesArray, setBwdUtilValuesArray] = useState();
  const [liveTimestamp, setLiveTimeStamp] = useState(dayjs.utc(Date.now()));
  const [previousIndex, setPreviousIndex] = useState(-1);
  const [activeRequests, setActiveRequests] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [valueChangedFromFunction, setValueChangedFromFunction] = useState();
  const [allShipsTimestampsAggFinalData, setAllShipsTimestampsAggFinalData] = useState([])
  const searchState = useGlobalFilterStore((state) => state.searchState);
  const searchFilterResults = useGlobalFilterStore(
    (state) => state.searchFilterResults
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////
  // Insights code
  const [sliderRange, setSliderRange] = useState({ min: 0, max: 720 });
  const [minValue, setMinValue] = useState(sliderRange.min);
  const [maxValue, setMaxValue] = useState(sliderRange.max);
  const [insightGradientString, setInsightGradientString] = useState("");

  // const { data: allTimestampsDataInsights, isLoading: allTimeStampsDataInsightsLoading, errorInsights } = useTimestampsInsights(
  //   { startingTime: startingTime, endingTime: endingTime },
  // );

  const handleTimeChange = (e) => {
    const timeZone = timeZones[selectedTimeFormat] || "UTC";
    // Convert slider values back to the actual timestamps in the correct time zone
    const minTime = dayjs(e.minValue).tz(timeZone).format('MM/DD/YYYY, h:mm:ss A');
    const maxTime = dayjs(e.maxValue).tz(timeZone).format('MM/DD/YYYY, h:mm:ss A');

    // console.log("e.minVlaue: ", e);

    setMinValue(e.minValue);
    setMaxValue(e.maxValue);

    setMinTimeCaption(minTime);
    setMaxTimeCaption(maxTime);
  };

  useEffect(() => {
    if (!insightTimeColData || minValue === undefined || maxValue === undefined || !sliderRange) return;
  
    // Calculate data time range
    const dataTimestamps = insightTimeColData.map((d) => new Date(d.ec_timestamp).getTime());
    const dataMinTimestamp = Math.min(...dataTimestamps);
    const dataMaxTimestamp = Math.max(...dataTimestamps);
    const dataTotalDuration = dataMaxTimestamp - dataMinTimestamp || 1; // Prevent division by zero
  
    // Map slider values to timestamps
    const lowerValueTimestamp = dataMinTimestamp + ((minValue - sliderRange.min) / (sliderRange.max - sliderRange.min)) * dataTotalDuration;
    const upperValueTimestamp = dataMinTimestamp + ((maxValue - sliderRange.min) / (sliderRange.max - sliderRange.min)) * dataTotalDuration;
  
    // Map timestamps to positions
    let lowerValuePosition = ((lowerValueTimestamp - dataMinTimestamp) / dataTotalDuration) * 100;
    let upperValuePosition = ((upperValueTimestamp - dataMinTimestamp) / dataTotalDuration) * 100;
  
    // Clamp positions
    lowerValuePosition = Math.max(0, Math.min(100, lowerValuePosition));
    upperValuePosition = Math.max(0, Math.min(100, upperValuePosition));
  
    // Sort data
    const sortedData = [...insightTimeColData].sort(
      (a, b) => new Date(a.ec_timestamp) - new Date(b.ec_timestamp)
    );
  
    // Calculate positions for data points and clamp them
    const gradientPoints = sortedData.map((dataPoint) => {
      const timestamp = new Date(dataPoint.ec_timestamp).getTime();
      let position = ((timestamp - dataMinTimestamp) / dataTotalDuration) * 100;
      position = Math.max(0, Math.min(100, position)); // Clamp position
      return {
        position,
        timestamp,
        value: dataPoint.value,
      };
    });
  
    // Compute bar widths
    const leftBarWidth = lowerValuePosition;
    const innerBarWidth = upperValuePosition - lowerValuePosition;
    const rightBarWidth = 100 - upperValuePosition;
  
    // Generate gradient color stops
    const gradientColorStopsLeft = [];
    const gradientColorStopsInner = [];
    const gradientColorStopsRight = [];
  
    gradientPoints.forEach((point) => {
      let opacity = point.position < lowerValuePosition || point.position > upperValuePosition ? 0.5 : 1;
      let color = getColorFromValue(point.value, opacity);
  
      if (point.position <= lowerValuePosition) {
        // Adjust position for left bar
        const adjustedPosition = leftBarWidth === 0 ? 0 : (point.position / leftBarWidth) * 100;
        const colorStop = `${color} ${adjustedPosition}%`;
        gradientColorStopsLeft.push(colorStop);
      } else if (point.position > lowerValuePosition && point.position <= upperValuePosition) {
        // Adjust position for inner bar
        const adjustedPosition = innerBarWidth === 0 ? 0 : ((point.position - lowerValuePosition) / innerBarWidth) * 100;
        const colorStop = `${color} ${adjustedPosition}%`;
        gradientColorStopsInner.push(colorStop);
      } else {
        // Adjust position for right bar
        const adjustedPosition = rightBarWidth === 0 ? 0 : ((point.position - upperValuePosition) / rightBarWidth) * 100;
        const colorStop = `${color} ${adjustedPosition}%`;
        gradientColorStopsRight.push(colorStop);
      }
    });
  
    // Construct gradient strings
    const gradientStringLeft = gradientColorStopsLeft.length
      ? `linear-gradient(to right, ${gradientColorStopsLeft.join(', ')})`
      : 'transparent';
  
    const gradientStringInner = gradientColorStopsInner.length
      ? `linear-gradient(to right, ${gradientColorStopsInner.join(', ')})`
      : 'transparent';
  
    const gradientStringRight = gradientColorStopsRight.length
      ? `linear-gradient(to right, ${gradientColorStopsRight.join(', ')})`
      : 'transparent';
  
    // Update the state
    setInsightGradientString({
      left: gradientStringLeft,
      inner: gradientStringInner,
      right: gradientStringRight,
    });
  
    // For debugging
    // console.log("Gradient Strings:", {
    //   left: gradientStringLeft,
    //   inner: gradientStringInner,
    //   right: gradientStringRight,
    // });
  }, [insightTimeColData, minValue, maxValue, sliderRange]);
  
  
  

  useEffect(() => {
    if (!insightGradientString) return;
    if (trackRef.current) {
      const barLeft = trackRef.current.querySelector('.multi-range-slider .bar-left');
      const barInner = trackRef.current.querySelector('.multi-range-slider .bar-inner');
      const barRight = trackRef.current.querySelector('.multi-range-slider .bar-right');
  
      if (barLeft) {
        barLeft.style.background = insightGradientString.left;
      }
      if (barInner) {
        barInner.style.background = insightGradientString.inner;
      }
      if (barRight) {
        barRight.style.background = insightGradientString.right;
      }
    }
  }, [insightGradientString]);
  

  useEffect(() => {
    if (minTimeCaption && maxTimeCaption) {
      const timeZone = timeZones[selectedTimeFormat] || "UTC";

      // Reformat the current captions to the new time zone
      const newMinTime = dayjs(minTimeCaption).tz(timeZone).format('MM/DD/YYYY, h:mm:ss A');
      const newMaxTime = dayjs(maxTimeCaption).tz(timeZone).format('MM/DD/YYYY, h:mm:ss A');

      // Update captions using .toLocaleString()
      setMinTimeCaption(newMinTime.toLocaleString());
      setMaxTimeCaption(newMaxTime.toLocaleString());
    }
  }, [selectedTimeFormat]);


  useEffect(() => {
    if (allTimestampsDataInsights && allTimestampsDataInsights.length > 0) {
      const labelCount = 10; // Maximum number of labels you want
      const startTime = new Date(allTimestampsDataInsights[0]).getTime();
      const endTime = new Date(allTimestampsDataInsights[allTimestampsDataInsights.length - 1]).getTime();

      // Set slider range based on the actual timestamp values
      setSliderRange({
        min: startTime,
        max: endTime,
      });
      // Set initial captions
      setMinTimeCaption(new Date(startTime).toLocaleString());
      setMaxTimeCaption(new Date(endTime).toLocaleString());
    }
  }, [allTimestampsDataInsights]);

  ////////////////////////////////////////////////////////////////////////////////////////////////

  // const { data: allTimestampsData, isLoading: allTimeStampsDataLoading, error } = useTimestamps(
  //   { startingTime: startingTime, endingTime: endingTime },
  // );

  useEffect(() => {
    if(!isChangedBoth) return;

    const FetchTimestamps = async ( start, end) => {
      const response = await fetchTimestamps(start,end);
      if(response && response.length>0)
      setAllTimestampsData(response);
    }

    const FetchShipsTimestampsAggData = async ( start, end) => {
      const response = await fetchShipsTimestampsAggData(start,end);
      if(response && response.length>0)
      setAllShipsTimestampsAggData(response)
    }

    const FetchTimestampsForInsights = async ( start, end) => {
      const response = await fetchTimestampsForInsights(start,end);
      if(response && response.length>0)
      setAllTimestampsDataInsights(response)
    }


    FetchTimestamps(startingTime, endingTime);
    FetchShipsTimestampsAggData(startingTime, endingTime);
    FetchTimestampsForInsights(startingTime, endingTime);

    setIsChangedBoth(false);
  }, [isChangedBoth] )

  // const { data: allShipsTimestampsAggData, isLoading: allShipsTimestampsAggDataLoading, allShipsTimestampsAggDataError } = useShipsTimestampsAggData(
  //   { startingTime: startingTime, endingTime: endingTime },
  // );

  useEffect(() => {
    if (!isLive) return; // Exit early if not live

    const intervalTime = 2 * 60 * 1000;
    const interval = setInterval(() => {
      setStartingTime(dayjs.utc(Date.now()));
      setEndingTime(dayjs.utc(Date.now()));
      setIsChangedBoth(true)
    }, intervalTime);

    // Clear the interval if site_name is defined and not "none"
    // if (selectedShip !== "none") {
    //   clearInterval(interval);
    // }

    // // Cleanup function to clear the interval when component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [isLive]);

  const handleStartingTimeAccept = () => {
    setIsLive(false);
    setIsStartingTimeOpen(false)
    if (isEndingTimeOpenedOnce) {
      if (dayjs(tempStartingTime).isAfter(dayjs(tempEndingTime))) {
        alert("Starting Time should be less than Ending Time");
        return;
      }
      setStartingTime(tempStartingTime)
      setEndingTime(tempEndingTime)
      setIsStartingTimeOpenedOnce(false)
      setIsEndingTimeOpenedOnce(false)
      setValue(-1);
      setPreviousIndex(-1);
      setPlayTimeLine(false);
      setPaused(true);
      setIsChangedBoth(true);
    }
    else {
      setIsEndingTimeOpen(true); // Open ending time picker after accepting
      setIsStartingTimeOpenedOnce(true)
    }
  };

  const handleStartingTimeClose = () => {
    // if(isEndingTimeOpenedOnce){
    //   Swal.fire({
    //     title: 'Ending Time Required',
    //     text: 'Please select an ending time.',
    //     icon: 'warning', // Optional: Use 'info', 'success', etc.
    //     toast: true,
    //     position: 'top-end', // Display at top-right corner
    //     timer: 2000, // Auto-close after 1.5 seconds
    //     showConfirmButton: false,
    //     timerProgressBar: true, // Optional: Show a progress bar
    //     customClass: {
    //       popup: 'my-toast-alert', // Add a custom class to the alert
    //     },
    //   });
    // }
    setIsStartingTimeOpen(false);
  }

  const handleEndingTimeClose = () => {
    // if(isStartingTimeOpenedOnce){
    //   Swal.fire({
    //     title: 'Ending Time Required',
    //     text: 'Please select an ending time.',
    //     icon: 'warning', // Optional: Use 'info', 'success', etc.
    //     toast: true,
    //     position: 'top-end', // Display at top-right corner
    //     timer: 2000, // Auto-close after 1.5 seconds
    //     showConfirmButton: false,
    //     timerProgressBar: true, // Optional: Show a progress bar
    //     customClass: {
    //       popup: 'my-toast-alert', // Add a custom class to the alert
    //     },
    //   });
    // }
    setIsEndingTimeOpen(false);
  }


  const handleEndingTimeAccept = () => {
    setIsLive(false);
    setIsEndingTimeOpen(false)
    if (isStartingTimeOpenedOnce) {
      if (dayjs(tempStartingTime).isAfter(dayjs(tempEndingTime))) {
        alert("Starting Time should be less than Ending Time");
        return;
      }
      setStartingTime(tempStartingTime)
      setEndingTime(tempEndingTime)
      setIsStartingTimeOpenedOnce(false)
      setIsEndingTimeOpenedOnce(false)
      setValue(-1);
      setPreviousIndex(-1);
      setPlayTimeLine(false);
      setPaused(true);
      setIsChangedBoth(true);
    }
    else {
      setIsStartingTimeOpen(true);
      setIsEndingTimeOpenedOnce(true)
    }
  };

  const handleTempStartingTimeChange = (newTempStartingTime) => {
    if (newTempStartingTime) {
      setTempStartingTime(newTempStartingTime.utc());
      setIsStartingOkDisabled(false); // Enable OK when a date is selected
    } else {
      setTempStartingTime(null);
      setIsStartingOkDisabled(true); // Disable OK if no date is selected
    }
  };

  const handleTempEndingTimeChange = (newTempEndingTime) => {
    if (newTempEndingTime) {
      setTempEndingTime(newTempEndingTime.utc());
      setIsEndingOkDisabled(false); // Enable OK when a date is selected
    } else {
      setTempEndingTime(null);
      setIsEndingOkDisabled(true); // Disable OK if no date is selected
    }
  };

  useEffect(() => {
    if (allTimestampsData && allTimestampsData.length > 0) {
      const timeStamps = [];

      for (var i = 0; i < allTimestampsData.length; i++) {
        timeStamps.push(dayjs(allTimestampsData[i]['ec_timestamp_utc']).utc());
      }

      setAllTimeStamps(timeStamps);

      const latestIndex = allTimestampsData.length - 1;
      const targetTimeZone = timeZones[selectedTimeFormat];
      const convertTime = (time) => dayjs.utc(time).tz(targetTimeZone);

      let newStartingTime = dayjs(allTimestampsData[0].ec_timestamp_utc).utc();
      let newEndingTime = dayjs(allTimestampsData[latestIndex].ec_timestamp_utc).utc();
      let newTimestamp = dayjs(allTimestampsData[latestIndex].ec_timestamp_utc).utc();

      if (value === -1 || latestIndex - value <= 5) {
        setValue(latestIndex);
        setCurrentIndex(0);
      } else if (value <= 2) {
        setValue(1);
        setCurrentIndex(1);
      } else {
        const newValue = value;
        setValue(value - 2);
        setCurrentIndex(newValue - 2);
      }

      // Only update state if the new values are different
      if (!newStartingTime.isSame(startingTime)) {
        setStartingTime(newStartingTime);
      }

      if (!newEndingTime.isSame(endingTime)) {
        setEndingTime(newEndingTime);
      }

      if (!newTimestamp.isSame(timestamp)) {
        setTimestamp(newTimestamp);
      }
    }
  }, [allTimestampsData]);

  useEffect(() => {
    if (searchFilterResults.length === 0 && searchState) {
      setAllShipsTimestampsAggFinalData([]);
      return;
    }

    if (!Array.isArray(allShipsTimestampsAggData) || allShipsTimestampsAggData.length === 0) {
      setAllShipsTimestampsAggFinalData([]);
      return;
    }

    if (searchFilterResults.length === 0) {
      setAllShipsTimestampsAggFinalData(allShipsTimestampsAggData);
      return;
    }

    const commonShipsData = allShipsTimestampsAggData.filter((data) =>
      searchFilterResults.includes(data.site_name)
    );

    setAllShipsTimestampsAggFinalData(commonShipsData);
  }, [allShipsTimestampsAggData, searchFilterResults]);


  useEffect(() => {
    if (allShipsTimestampsAggFinalData && allShipsTimestampsAggFinalData.length > 0) {
      // Group data by ec_timestamp
      const aggregatedData = allShipsTimestampsAggFinalData.reduce((acc, curr) => {
        const { ec_timestamp, avg_qoe, avg_cir_avail, avg_demand_met, avg_bwd_utlization } = curr;

        if (!acc[ec_timestamp]) {
          acc[ec_timestamp] = {
            qoeValues: [],
            cirValues: [],
            demandValues: [],
            bwdUtilValues: []
          };
        }

        // Collect the values for each timestamp
        acc[ec_timestamp].qoeValues.push(avg_qoe);
        acc[ec_timestamp].cirValues.push(avg_cir_avail);
        acc[ec_timestamp].demandValues.push(avg_demand_met);
        acc[ec_timestamp].bwdUtilValues.push(avg_bwd_utlization);

        return acc;
      }, {});

      // Helper function to calculate the average of min, 10th, and 20th percentile
      const calculateAverageOfPercentiles = (values) => {
        // Sort the values to calculate percentiles
        const sortedValues = [...values].sort((a, b) => a - b);

        const min = sortedValues[0];
        const p3Index = Math.floor(0.03 * (sortedValues.length - 1));
        const p10Index = Math.floor(0.1 * (sortedValues.length - 1));
        const p20Index = Math.floor(0.2 * (sortedValues.length - 1));

        const p3Value = sortedValues[p3Index];
        const p10Value = sortedValues[p10Index];
        const p20Value = sortedValues[p20Index];

        const avg = (p3Value + p10Value + p20Value) / 3;

        return avg;
      };

      // Arrays to hold the calculated values
      const qoeValues = [];
      const cirValues = [];
      const demandValues = [];
      const bwdUtilValues = [];

      // Process each timestamp group
      Object.keys(aggregatedData).forEach((timestamp) => {
        const data = aggregatedData[timestamp];

        qoeValues.push(calculateAverageOfPercentiles(data.qoeValues));
        cirValues.push(calculateAverageOfPercentiles(data.cirValues));
        demandValues.push(calculateAverageOfPercentiles(data.demandValues));
        bwdUtilValues.push(calculateAverageOfPercentiles(data.bwdUtilValues));
      });

      // Update state arrays with the calculated values
      setQoeValuesArray(qoeValues);
      setCirValuesArray(cirValues);
      setDemandValuesArray(demandValues);
      setBwdUtilValuesArray(bwdUtilValues);
    }
    else {
      setQoeValuesArray([]);
      setCirValuesArray([]);
      setDemandValuesArray([]);
      setBwdUtilValuesArray([]);
    }
  }, [allShipsTimestampsAggFinalData]);


  useEffect(() => {
    const timeZone = timeZones[selectedTimeFormat] || "UTC";
    setUIStartingTime(dayjs(startingTime).tz(timeZone));
    setUIEndingTime(dayjs(endingTime).tz(timeZone))
  }, [startingTime, endingTime, selectedTimeFormat])



  useEffect(() => {
    if (!qoeValuesArray || !cirValuesArray || !bwdUtilValuesArray || !demandValuesArray) return;

    function gradientGenerator(arr) {

      function getColorFromValue(value) {
        if (value === null) return theme.palette.neon.black;

        // Adjust the thresholds based on the value range
        if (value <= 40) return theme.palette.neon.red;    // red for low values
        if (value <= 70) return theme.palette.neon.orange; // orange for medium values
        return theme.palette.neon.green;                   // green for high values
      }

      function generateGradientString(valuesArray) {
        // Generate a color for each value in the array
        const colors = valuesArray.map(getColorFromValue);

        // Return a simple gradient string with the colors
        // The gradient will transition smoothly between the colors
        return `linear-gradient(90deg, ${colors.join(', ')})`;
      }

      let gradientString = generateGradientString(arr);

      const newHeatmapSlider = styled(Slider)({
        color: 'transparent',
        height: 25,
        '& .MuiSlider-thumb': {
          height: 20,
          width: 10,
          borderRadius: '8px',
          backgroundColor: '#fff',
          border: '2px solid currentColor',
          '&:focus, &:hover, &.Mui-active': {
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.4)',
            transition: 'box-shadow 0.3s ease',
          },
          '&.Mui-focusVisible': {
            boxShadow: '0 0 10px rgba(128, 128, 128, 0.8)',
            borderRadius: '8px',
          },
        },
        '& .MuiSlider-track': {
          height: 12,
        },
        '& .MuiSlider-rail': {
          height: 12,
          borderRadius: 4,
          opacity: 0.7,
          backgroundImage: gradientString,
        },
        '& .MuiSlider-mark': {
          height: 8,
          width: 1,
          backgroundColor: 'black',
        },
        '& .MuiSlider-markLabel': {
          marginTop: 13,
          fontSize: '10px',
        },
        '& .MuiSlider-valueLabel': {
          backgroundColor: 'transparent',
          color: '#000',
          fontSize: '12px',
          marginTop: '12px',
          '&::before': {
            display: 'none',
          },
          '& > span': {
            backgroundColor: 'transparent',
          },
        },
      });

      setColouredHeatMap(() => newHeatmapSlider);
    }

    if (selectedType === "qoe") {
      gradientGenerator(qoeValuesArray);
    } else if (selectedType === "cir") {
      gradientGenerator(cirValuesArray);
    } else if (selectedType === "demand") {
      gradientGenerator(demandValuesArray)
    } else if (selectedType === "utlization") {
      gradientGenerator(bwdUtilValuesArray)
    }
  }, [qoeValuesArray, cirValuesArray, selectedType, bwdUtilValuesArray, demandValuesArray]);


  // useEffect(() => {
  //   if (allTimeStamps.length === 0 || !requestIndex) return;

  //   // Function to generate requests
  //   const generateRequests = (functions, timestamps, startIndex, endIndex) => {
  //     const requests = [];
  //     functions.forEach(fn => {
  //       for (let i = startIndex; i <= endIndex; i++) {
  //         requests.push(fn(timestamps[i]));
  //       }
  //     });
  //     return requests;
  //   };

  //   // Function to fetch all data with progress tracking
  //   const fetchAllData = async (functions, timestamps, startIndex, endIndex) => {
  //     const requests = generateRequests(functions, timestamps, startIndex, endIndex);
  //     let loadedCount = 0;
  //     const totalRequests = requests.length;

  //     const updateProgress = () => {
  //       loadedCount++;
  //       const progressPercentage = Math.round((loadedCount / totalRequests) * 100);
  //       setFetchProgress(progressPercentage);
  //     };

  //     // Wrap each request with progress tracking
  //     const requestsWithProgress = requests.map(req =>
  //       req.finally(updateProgress)
  //     );

  //     try {
  //       const results = await Promise.all(requestsWithProgress);
  //       return results;
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //       return [];
  //     }
  //   };

  //   // Debounced fetchData function
  //   const debouncedFetchData = debounce(async () => {
  //     setIsFetchingCompleted(false);
  //     setFetchProgress(0); // Reset progress at the start of fetching
  //     const data = await fetchAllData(urlsToFetchByTimestamp, allTimeStamps, requestIndex.start, requestIndex.end);
  //     // Cache the fetched data
  //     setIsFetchingCompleted(true);
  //   }, 2000);

  //   // Call the debounced fetchData function
  //   debouncedFetchData();

  //   // Cleanup the debounced function
  //   return () => {
  //     debouncedFetchData.cancel();
  //   };
  // }, [allTimeStamps, requestIndex]);


  useEffect(() => {
    if (!startTimeStampFromChat || !endTimeStampFromChat) return;
    if (!paused) return;

    const start = dayjs(startTimeStampFromChat).utc().set('second', 0);
    const end = dayjs(endTimeStampFromChat).utc().set('second', 0);

    // Update state only once
    setStartingTime(start);
    setEndingTime(end);
    setIsChangedBoth(true)

    // Clear the chat timestamps
    setStartTimeStampFromChat(null);
    setEndTimeStampFromChat(null);
  }, [startTimeStampFromChat, endTimeStampFromChat, paused]); // Ensure paused is included in the dependency array


  useEffect(() => {
    let intervalId;
    const playbackSpeed = 400;

    if (playTimeLine && !paused) {
      intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex === (allTimeStamps.length - 1)) {
            setPlayTimeLine(false);
            setTimestamp(allTimeStamps[allTimeStamps.length - 1])
            setValue(allTimeStamps.length - 1);
            setPaused(true);
            clearInterval(intervalId);
            return 0;
          }
          const newIndex = Math.min(prevIndex + 1, allTimeStamps.length - 1);
          setTimestamp(allTimeStamps[newIndex]);
          setValue(newIndex);
          return newIndex;
        });
      }, playbackSpeed);
    }

    return () => clearInterval(intervalId); // Clean up the interval on unmount or when dependencies change
  }, [playTimeLine, paused, allTimeStamps]);

  useEffect(() => {
    if (value === -1) return;

    async function handleBatchApiCalls() {
      // Check conditions with the latest values of value and previousIndex
      if (value >= previousIndex) {
        await startBatchAPICalls(value + 29);
      }

      if (previousIndex === -1) {
        await startBatchAPICalls(0); // Wait for batch calls to finish
      }
    }

    // Set up the timeout to call the async function after 1000ms
    const timeout = setTimeout(() => {
      handleBatchApiCalls();
    }, 300);

    // Cleanup function to clear the timeout on unmount or dependency change
    return () => clearTimeout(timeout);

    // Ensure that playTimeLine, previousIndex, and startBatchAPICalls are included in the dependencies
  }, [value]);

  const debouncedSetTimeStamp = useCallback(
    debounce((newValue) => {
      if (allTimestampsData && allTimestampsData.length > 0) {
        setTimestamp(dayjs(allTimestampsData[newValue]['ec_timestamp_utc']).utc());
      }
    }, 1000),
    [allTimestampsData]
  );

  const handleChange = async (event, newValue) => {
    setIsLive(false);
    setValue(newValue);
    setPaused(true);
    if (allTimestampsData && allTimestampsData.length > 0) {
      debouncedSetTimeStamp(newValue);
      setCurrentIndex(newValue);
    }
    setValueChangedFromFunction(newValue);
    // await startBatchAPICalls(newValue);
    if (playTimeLine) setPaused(false);
  };


  useEffect(() => {
    if (!valueChangedFromFunction) return;

    const startAPICall = async () => {
      await startBatchAPICalls(valueChangedFromFunction);
    };

    const timeOut = setTimeout(() => {
      startAPICall();
    }, 300);


    return () => clearTimeout(timeOut);
  }, [valueChangedFromFunction]);


  useEffect(() => {
    return () => {
      // Cancel any pending debounced calls on component unmount
      debouncedSetTimeStamp.cancel();
    };
  }, [debouncedSetTimeStamp]);

  const getLabel = (value) => {
    if (allTimestampsData && allTimestampsData.length > 0) {
      const utcTimestamp = allTimestampsData[value]['ec_timestamp_utc'];

      // Convert the UTC timestamp to the selected timezone
      const formattedDate = dayjs.utc(utcTimestamp).tz(timeZones[selectedTimeFormat]);

      // Format the date to a string in the desired format (YYYY-MM-DD HH:mm:ss)
      return formattedDate.format('YYYY-MM-DD HH:mm:ss');
    }
  };


  async function handlePlayTimeLine() {
    setIsLive(false);

    // Handling play/pause logic after ensuring data fetching is completed
    if (paused === false) {
      setPaused(true);
      setPlayTimeLine(false);
    } else {
      setPaused(false);
      setPlayTimeLine(true);
    }
  }

  async function startBatchAPICalls(currentValue) {
    setActiveRequests((prev) => prev + 1);
    const batchSize = 30;

    let currentBatchIndex = currentValue;

    // Check if already at the end of the timestamps array
    if (currentValue >= allTimeStamps.length - 1) {
      setActiveRequests((prev) => prev - 1); // No more fetching required
      return;
    }

    // Get the starting and ending times for the current batch
    const batchStartingTime = allTimeStamps[currentBatchIndex];
    const batchEndingIndex = Math.min(currentBatchIndex + batchSize - 1, allTimeStamps.length - 1);
    const batchEndingTime = allTimeStamps[batchEndingIndex];

    // Update previous index state
    setPreviousIndex(currentValue);

    var isCachedDataAvailable = true;

    for (var i = currentBatchIndex; i <= batchEndingIndex; i++) {
      const data = await fetchDataByTimestamp(allTimeStamps[i], false);

      if (!data) {
        isCachedDataAvailable = false;
        break;
      }
    }

    if (isCachedDataAvailable) {
      setActiveRequests((prev) => prev - 1);
      return;
    }

    // Fetch batch data and wait for it to complete
    try {
      await fetchFullShipDataUsingBatch(startingTime, endingTime, batchStartingTime, batchEndingTime);
    } catch (error) {
      console.error('Error fetching batch data:', error);
    }

    // Mark fetching as completed
    setActiveRequests((prev) => prev - 1);
  }

  useEffect(() => {
    // Set fetching completed based on active requests count
    setIsFetchingCompleted(activeRequests === 0);
  }, [activeRequests]);



  function handleGoLive() {
    setPaused(true);
    setPlayTimeLine(false);
    setStartingTime(dayjs.utc(Date.now()));
    setEndingTime(dayjs.utc(Date.now()));
    setIsChangedBoth(true);
    setCurrentIndex(0);
    setValue(-1);
    setIsLive(true);
  }

  // useEffect(()=>{
  //   console.log("This is minvalue: ", minValue, " this is maxValue: ", maxValue);
  // }, [minValue, maxValue])


  const SliderComponent = colouredHeatMap || defaultHeatmapSlider;

  return (
    <div className='w-[100vw] h-16 flex flex-col'>

      <div className='flex  flex-row w-[100%] mx-auto justify-center items-center h-full'>

        <div className='flex h-full items-center w-[30%] justify-between'>
          <div className='mt-4 w-[50%]'>
            <LocalizationProvider dateAdapter={AdapterDayjs} >

              <DateTimePicker
                views={['year', 'month', 'day', 'hours', 'minutes']}
                closeOnSelect={false}
                timezone={timeZones[selectedTimeFormat]}
                label="Starting Time"
                value={UIstartingTime}
                open={isStartingTimeOpen}
                onClose={handleStartingTimeClose} // Just closes the picker, no side-effects
                onAccept={(newTempStartingTime) => handleStartingTimeAccept(newTempStartingTime)} // Triggered only on "OK"
                onChange={handleTempStartingTimeChange} // Store as UTC
                minDateTime={dayjs('2024-10-01T12:00:00.000+00:00').utc()}
                disableFuture
                format="DD-MM-YYYY HH:mm:ss"
                slotProps={{
                  actionBar: {
                    actions: isStartingOkDisabled ? ['cancel'] : ['cancel', 'accept'], // Only show OK when enabled
                  },
                  textField: {
                    size: 'small',
                    onClick: () => setIsStartingTimeOpen(true),
                    sx: {
                      width: '90%',
                      '& .MuiInputBase-root': {
                        height: '20px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.palette.footer.dateTimePicker.color,
                        background: theme.palette.footer.dateTimePicker.background,
                      },
                      '& .MuiInputBase-input': {
                        padding: '0 8px',
                        height: '20px',
                        lineHeight: '20px',
                        boxSizing: 'border-box',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '12px', // Change label font size
                        top: '-6px', // Adjust the vertical position
                        lineHeight: '20px',
                        color: theme.palette.footer.dateTimePicker.label, // Change label color
                        fontWeight: 'bold', // Make the label bold
                      },
                    },
                    InputProps: {
                      endAdornment: (
                        <IconButton onClick={() => setIsStartingTimeOpen(true)}>
                          <CalendarMonthIcon sx={{ fontSize: '20px', color: theme.palette.footer.dateTimePicker.icon }} />
                        </IconButton>
                      ),
                    },
                  },
                  layout: {
                    sx: {
                      backgroundColor: theme.palette.footer.dateTimePicker.calendarbg, // Set your custom background color here
                      color: theme.palette.footer.dateTimePicker.calendarText, // Optional: Adjust text color inside the calendar popup
                      borderRadius: '8px', // Optional: Adjust border radius
                      border: '2px solid black'
                    }
                  },
                }}
              />


            </LocalizationProvider>
          </div>

          <div className='mt-4 w-[50%]'>
            <LocalizationProvider dateAdapter={AdapterDayjs} >

              <DateTimePicker
                views={['year', 'month', 'day', 'hours', 'minutes']}
                closeOnSelect={false}
                timezone={timeZones[selectedTimeFormat]}
                label="Ending Time"
                value={UIendingTime}
                open={isEndingTimeOpen}
                onClose={handleEndingTimeClose} // Just closes the picker, no side-effects
                onAccept={(newTempEndingTime) => handleEndingTimeAccept(newTempEndingTime)} // Triggered only on "OK"
                onChange={handleTempEndingTimeChange}
                minDateTime={dayjs('2024-10-01T12:00:00.000+00:00').utc()}
                disableFuture
                format="DD-MM-YYYY HH:mm:ss"
                slotProps={{
                  actionBar: {
                    actions: isEndingOkDisabled ? ['cancel'] : ['cancel', 'accept'], // Only show OK when enabled
                  },
                  textField: {
                    size: 'small',
                    onClick: () => setIsEndingTimeOpen(true),
                    sx: {
                      width: '90%',
                      '& .MuiInputBase-root': {
                        height: '20px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.palette.footer.dateTimePicker.color,
                        background: theme.palette.footer.dateTimePicker.background
                      },
                      '& .MuiInputBase-input': {
                        padding: '0 8px',
                        height: '20px',
                        lineHeight: '20px',
                        boxSizing: 'border-box',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '12px', // Change label font size
                        top: '-6px', // Adjust the vertical position
                        lineHeight: '20px',
                        color: theme.palette.footer.dateTimePicker.label, // Change label color
                        fontWeight: 'bold', // Make the label bold
                      },
                    },
                    InputProps: {
                      endAdornment: (
                        <IconButton onClick={() => setIsEndingTimeOpen(true)}>
                          <CalendarMonthIcon sx={{ fontSize: '20px', color: theme.palette.footer.dateTimePicker.icon }} />
                        </IconButton>
                      ),
                    },
                  },
                  layout: {
                    sx: {
                      backgroundColor: theme.palette.footer.dateTimePicker.calendarbg, // Set your custom background color here
                      color: theme.palette.footer.dateTimePicker.calendarText, // Optional: Adjust text color inside the calendar popup
                      borderRadius: '8px', // Optional: Adjust border radius
                      border: '2px solid black'
                    }
                  },
                }}
              />


            </LocalizationProvider>
          </div>
        </div>

        <div className="flex h-20 mx-4 space-x-1 justify-center items-center">
          {path !== "/nexus_ui/insightshub" && <div
            className={`flex space-x-5 items-center justify-center`}
          >
            {paused ? <PlayCircleIcon sx={{ color: theme.palette.footer.icon.color }} className={`${isFetchingCompleted ? "cursor-pointer" : "cursor-not-allowed"}`} fontSize='large' onClick={isFetchingCompleted ? handlePlayTimeLine : null} /> : <PauseCircleIcon sx={{ color: theme.palette.footer.icon.color }} className='cursor-pointer' fontSize='large' onClick={handlePlayTimeLine} />}
          </div>}
        </div>

        <div ref={trackRef} className='w-[65%] flex justify-between items-center'>
          {path === '/nexus_ui/insightshub' ?
            <MultiRangeSlider
              style={{ border: "none", boxShadow: "none", color: 'white', width: '100%', backgroundColor: "transparent" }}
              min={sliderRange.min}
              max={sliderRange.max}
              minValue={sliderRange.min}
              maxValue={sliderRange.max}
              step={60}
              minCaption={minTimeCaption}
              maxCaption={maxTimeCaption}
              onInput={handleTimeChange}
              ruler={false}
              className="multi-range-slider-label"  // Apply custom class
            />
            :
            <SliderComponent
              value={value}
              onChange={handleChange}
              valueLabelDisplay="on"
              valueLabelFormat={value => <div style={{ color: mode === 'dark' ? theme.palette.neon.blue : 'red' }}>{getLabel(value)}</div>}
              step={1}
              min={0}
              max={allTimestampsData && allTimestampsData.length > 0 ? allTimestampsData.length - 1 : 0}
              marks
              style={{ width: '94%' }}
              slotProps={{
                valueLabel: {
                  sx: {
                    '& .MuiSlider-valueLabelCircle': {
                      position: 'absolute',
                      zIndex: 1300, // Adjust z-index if needed
                      top: '-10px'
                    },
                  },
                },
              }}
            />
          }

          <div onClick={handleGoLive} className='flex items-center justify-center space-x-2 ml-2 text-[#FF073A]  px-2 rounded-lg cursor-pointer' style={{ backgroundColor: mode === "light" ? "white" : "black" }}>
            {/* <div className={`h-3 w-3 rounded-full ${(new Date(liveTimestamp).getTime()) === (new Date(timestamp).getTime()) ? "bg-[#FF073A]" : "bg-gray-500"}`}></div>  <span>Live</span> */}
            <div className={`h-3 w-3 rounded-full ${isLive ? "bg-[#FF073A]" : "bg-gray-500"}`}></div>  <span>Live</span>

          </div>

          <IconButton
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </div>

      </div>


    </div>
  );
};

export default memo(TimeSlider);