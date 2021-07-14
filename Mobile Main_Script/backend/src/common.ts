interface Range {
  from: string, 
  to: string
}

interface Select {
  value: string, 
  text: string
}

interface Filters {
  [key: string]: { [key: string]: string } | null,
}

export function buildOrderBy(table_alias: string, sortBy: string, sortDesc: string) {
  let order = '';
  if (sortBy.length) {
    const orderBy = [];
    const order_names = sortBy.split(",");
    const order_types = sortDesc.split(",");
    for (let i = 0; i < order_names.length; i++) {
      let name = order_names[i];
      let type = order_types[i] == 'true' ? 'DESC' : 'ASC';
      if (name == 'percent') {
        name = 'price_2_5';
        orderBy.push(`ABS(${table_alias}.price_2_5 - ${table_alias}.price)/(${table_alias}.price) ${type}`);
      } else if (name == 'differenz'){
        name = 'price_2_5';
        orderBy.push(`ABS(${table_alias}.price_2_5 - ${table_alias}.price) ${type}`);
      } else if (name == 'brand_name'){
        name = 'brand_name';
        orderBy.push(`b.brand_name ${type}`);
      } else if (name == 'model_name') {
        name = 'model_name';
        orderBy.push(`m.model_name ${type}`);
      }else {
            orderBy.push(`${table_alias}.${name} ${type}`);
        }
      }

    if (orderBy.length) {
      order = `ORDER BY ${orderBy.join(', ')}`;
    }
  }
  return order;
}

export function buildWhere(table_alias: string, filters: Filters, search: string | null, search_attribute: string | null) {
  let where = '';
  if (search && search.length) {
    where = `WHERE ${table_alias}.${search_attribute} LIKE '%${search}%'`;
  }
  const filterBy: string[] = [];
  for (const [name, filter] of Object.entries(filters)) {
    if(name == 'countfeature' && filter){
      if(filter[0]=='0'){
        filterBy.push(`( ${table_alias}.count = 0 OR ${table_alias}.count IS NULL ) `);
      } else if(filter[0] == '1'){
        filterBy.push(`${table_alias}.count != 0 AND ${table_alias}.count IS NOT NULL `);
      }
    } else if(name == 'results' && filter){
      if(filter[0] == 'O'){
        filterBy.push(`${table_alias}.count > 0`);
      } else if(filter[0] == '0'){
        filterBy.push(`${table_alias}.count = 0`);
      } else if(filter[0] == 'I'){
        filterBy.push(`${table_alias}.count IS NULL`);
      }
    } else if(name == 'available' && filter){
      var moment = require('moment');
      var now_time = moment().format('Y-MM-DD hh:mm:ss');
      if(filter[0] == 'J'){
        filterBy.push(`${table_alias}.end_date > '${now_time}'`);
      } else if(filter[0] == 'N'){
        filterBy.push(`${table_alias}.end_date <= '${now_time}'`);
      }
    } else{
      if (filter) {
        if (filter.value) {
          filterBy.push(`${table_alias}.${name} = '${filter.value}'`);
        }
        else {
          if (filter.from) {
            if (name === 'first_registration') {
              filterBy.push(`YEAR(${table_alias}.${name}) >= ${filter.from}`);
            }
            else filterBy.push(`${table_alias}.${name} >= ${filter.from}`);
          }
          if (filter.to) {
            if (name === 'first_registration') {
              filterBy.push(`YEAR(${table_alias}.${name}) <= ${filter.to}`); 
            }
            else filterBy.push(`${table_alias}.${name} <= ${filter.to}`); 
          }
        }
      }
    }
  }  if(filterBy.length) {
    if(where !== '') {
      where += " AND " + filterBy.join(" AND ");
    }
    else {
      where = "WHERE " + filterBy.join(" AND ");
    }
  }
  return where;
}

export function buildLimit(page: string, itemsPerPage: string) {
  return `LIMIT ${(parseInt(page)-1) * parseInt(itemsPerPage)}, ${parseInt(itemsPerPage)}`;
}