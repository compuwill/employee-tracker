INSERT INTO department (name)
VALUES
  ('Operations'),
  ('Recruiting'),
  ('IT'),
  ('HR'),
  ('Safety');

INSERT INTO role (title, salary, department_id)
VALUES
  ('Dispatcher', 60000, 1),
  ('Operations Manager', 125000, 1),
  ('Recruiter', 50000, 2),
  ('Recruiting Manager', 80000, 2),
  ('Helpdesk', 40000, 3),
  ('Helpdesk Manager', 60000, 3),
  ('Software Engineer', 100000, 3),
  ('Director of IT', 150000, 3),
  ('Benefits Manager', 70000, 4),
  ('Director of Human Resources', 150000, 4),
  ('Safety', 50000, 5),
  ('Safety Manager', 70000, 4);

-- insert the managers
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
  ('James', 'Fraser', 2, null),
  ('Robert', 'Bruce', 1, null),
  ('Erika', 'Sanchez', 4, null),
  ('Brian', 'Bushes', 8, null),
  ('Katie', 'Aguila', 10, null),
  ('Lisa', 'Shinythorn', 12, null);

-- insert the rest of the employees
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
  ('Jack', 'London', 1, 1),
  ('April', 'Delfino', 3, 3),  
  ('Erik', 'Snider', 5, 4),
  ('Carter', 'Floss', 5, 4),  
  ('Will', 'Vorngsam', 7, 4),
  ('Heather', 'Feathering', 9, 5),  
  ('Bridget', 'Lunches', 11, 6);
