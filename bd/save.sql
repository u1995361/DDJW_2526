CREATE TABLE Saves (
  id number(11) PRIMARY KEY,
  items varchar(512),
  states varchar(64),
  lastCard number(5),
  score number(5),
  pairs number(2)
);