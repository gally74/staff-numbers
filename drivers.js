// Raw driver data: "Name StaffNumber" per line
const DRIVER_DATA = `
Adam Scanlon 497584
Adrian Kerrigan 616303
Aidan Browne 845809
Aidan O'Brien 617301
Aidan Ridgeway 679471
Aisling O'Leary 847674
Alan O'Flynn 620807
Andrew Cosgrave 836974
Bart Nowaczek 738867
Bernard Considine 678864
Brendan O'Callaghan 358037
Brian Wakefield 672807
Bryan Jordan 794325
Chloe Reddan 845574
Christopher Harris 737143
Conor Flanagan 497568
Conor Murphy 678392
Damien Hegarty 618594
Damien O'Leary 617032
Damien O'Regan 446580
Denis McCarthy 676977
Denis O'Leary 354996
Dermot Coady 617849
Desmond O'Leary 508391
Edward Dean 843857
Erik O'Regan 619035
Fiona Walsh 843849
Gary Moore 845566
Gavin Brett 617326
Gavin Delaney 737968
Gerard Nawra 738875
Greg Ahern 738905
Humphrey Allen 737151
Ian Clarke 615099
Jack O'Riordan 847704
James Moore 618292
Jer Murphy 677248
Jim Leahy 676837
Joe Byrne 678902
Joe Stack 617660
John Buttimer 122238
John Duggan 622222
John Goggin 622486
Jonathan Boyd 619469
Jonathan Deasy 129720
Jonathan Dennehy 737951
Jonathan Hallihan 618969
Keith McNamara 622206
Ken Fox 677094
Kieran Brett 678872
Kieran Cotter 677434
Kieran Hegarty 128619
Konrad Michalski 846325
Kyle O'Donovan 845817
Liam Cotter 677124
Liam Martin 620831
Mark Dineen 453341
Martin Cotter 677167
Martin Dawe 621481
Matthew Ryan 453374
Michael Lane 447651
Niall McCarthy 618535
Noel Kelleher 621242
Pat Finnegan 619108
Paul Egan 618527
Robbie Walsh 845541
Roy Galvin 678732
Roy O'Sullivan 843830
Sean Cullinane 351725
Sean Kiely 846279
Shane Brohier 617741
Shane Kenny 496121
Stephen Healy 353108
Stephen Timoney 738883
Steve Fitzcarlos 847690
Terry White 619061
Thomas Gardiner 678074
Thomas Gordaneer 845949
Chris Gould 618306
Derek Fenlon 678791
Liam Mulcahy 620440
Tim O'Leary 618012
Tom Allen 619000
Tony Buckley 676918
Tom Loughnane 732737
Tom O'Mahony 618098
Tony Cummins 616958
William Hurley 678619
`.trim();

// Turn that string into an array of objects: { name, staffNumber }
function parseDrivers(raw) {
  return raw.split("\n").map(line => {
    const parts = line.trim().split(/\s+/);
    const staffNumber = parts.pop();
    const name = parts.join(" ");
    return { name, staffNumber };
  });
}

// Base list that ships with the app:
const BASE_DRIVERS = parseDrivers(DRIVER_DATA);
