import React, { useEffect, useState } from 'react'
import { useGlobalState } from '../../Context/globalState';
import userImage from '../../assets/userImage.jpg'
import profilePicture from '../../assets/profile.png'

const Students = () => {
  
  const { user, setUser, seats, setSeats } = useGlobalState();
  const [allStudents, setAllStudents] = useState([])

  useEffect(() => {
    // Filter and sort students when seats change
    const filteredStudents = seats
      .filter(seat => seat.userId !== "") // Keep only seats with a userId
      .sort((a, b) => a.userName.localeCompare(b.userName)); // Sort by userName

    console.log(filteredStudents)

    setAllStudents(filteredStudents); // Update the state with the filtered and sorted students
  }, [seats]);

  return (

    <div className='flex flex-wrap gap-5 justify-center mt-12'>
    
      {allStudents.map((student, index) => (
        <div key={index} className="w-60 h-52 bg-white border flex flex-col items-center justify-center rounded-lg shadow">
            <img className="w-28 h-28  rounded-full shadow-lg" src={student.userImage !== "" ? student.userImage : profilePicture} alt="user image"/>
            <h5 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">{student.userName ? student.userName : "student"}</h5>
            <span className="text-sm text-gray-500 dark:text-gray-400">Seat No : {student.id}</span>
        </div>
      ))}

    </div>

  )
}

export default Students