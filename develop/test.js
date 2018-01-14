import Database from '../server/database';

Database.separation.search.all('奥')
  .then(results => console.log(results))
  .catch(err => console.log(err));
