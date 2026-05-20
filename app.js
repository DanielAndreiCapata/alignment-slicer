document.getElementById("slice").onclick = async () => {

  const start =
    document.getElementById("start").value;

  const end =
    document.getElementById("end").value;

  if(start === "" || end === ""){

    alert(
      "Please enter start and end chainage"
    );

    return;
  }

  const startNumber = Number(start);
  const endNumber = Number(end);

  if(startNumber >= endNumber){

    alert(
      "End chainage must be greater than start chainage"
    );

    return;
  }

  alert(

    "Creating slice from:\n\n" +

    startNumber +

    " m\n\n to \n\n" +

    endNumber +

    " m"

  );

};
