const express = require('express');
const { results } = require('./data/joyas');
const app = express();

// 1. Crear una ruta para la devolución de todas las joyas aplicando HATEOAS.
const HATEOASV1 = () => {
  return results.map((item) => {
    return {
      name: item.name,
      href: `http://localhost:3000/api/v1/joyas/${item.id}`,
    };
  });
};

app.get('/api/v1/joyas', (req, res) => {
  return res.json(HATEOASV1());
});

// 2. Hacer una segunda versión de la API que ofrezca los mismos datos pero con los nombres de las propiedades diferentes.

const HATEOASV2 = () => {
  return results.map((item) => {
    return {
      jewel: item.name,
      url: `http://localhost:3000/api/v2/joyas/${item.id}`,
    };
  });
};

app.get('/api/v2/joyas', (req, res) => {
  const { order, page } = req.query;
  const jewelsWithUrls = HATEOASV2();

  //6. Permitir hacer paginación de las joyas usando Query Strings.
  //Ejemplo para prueba: http://localhost:3000/api/v2/joyas?page=1
  if (page) {
    const jewelPage = jewelsWithUrls.slice(page * 2 - 2, page * 2);
    return res.json(jewelPage);
  }

  if (!order) return res.json(jewelsWithUrls);

  // 7. Permitir hacer ordenamiento de las joyas según su valor de forma ascendente o descendente usando Query Strings.
  //Ejemplo para prueba: http://localhost:3000/api/v2/joyas?order=desc
  let orderedJewels = [];
  if (order === 'asc') {
    orderedJewels = results.sort((a, b) => (a.value > b.value ? 1 : -1));
  }
  if (order === 'desc') {
    orderedJewels = results.sort((a, b) => (a.value < b.value ? 1 : -1));
  }
  return res.json(orderedJewels);
});

// 3. La API REST debe poder ofrecer una ruta con la que se puedan filtrar las joyas por categoría.
// Ejemplo para prueba: http://localhost:3000/api/v2/categorias/anillo
app.get('/api/v2/categorias/:categoria', (req, res) => {
  const { categoria } = req.params;
  const filteredJewels = results.filter((item) => item.category == categoria);
  return res.json(filteredJewels);
});

// 4. Crear una ruta que permita el filtrado por campos de una joya a consultar.
//Ejemplo para prueba: http://localhost:3000/api/v2/joyas/1?fields=name,category,value
app.get('/api/v2/joyas/:id', (req, res) => {
  const { id } = req.params;
  const jewel = results.find((item) => item.id == id);

  // Crear una ruta que devuelva como payload un JSON con un mensaje de error cuando el usuario consulte el id de una joya que no exista.
  //Ejemplo para prueba: http://localhost:3000/api/v2/joyas/7
  if (!jewel) {
    return res.status(404).json({ msg: `No existe una joya con el id ${id}` });
  }

  const { fields } = req.query;
  if (!fields) return res.json(jewel);
  const arrayOfFields = fields.split(',');
  for (let prop in jewel) {
    if (!arrayOfFields.includes(prop)) delete jewel[prop];
  }
  return res.json(jewel);
});

const port = process.env.PORT || 3000;
app.listen(port, console.log('Server ON'));
