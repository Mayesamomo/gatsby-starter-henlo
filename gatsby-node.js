const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const { createFilePath } = require('gatsby-source-filesystem');

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions;

  return graphql(`
    {
      allMarkdownRemark(limit: 1000) {
        edges {
          node {
            id
            fields {
              slug
            }
            frontmatter {
              layout
              slug
              type
            }
          }
        }
      }
    }
  `).then((result) => {
    if (result.errors) {
      console.log('errors', results.errors);
      result.errors.forEach((e) => console.error(e.toString()));
      return Promise.reject(result.errors);
    }

    console.log(result.data.allMarkdownRemark.edges);

    const postOrPage = result.data.allMarkdownRemark.edges.filter((edge) => {
      console.log(edge.node.frontmatter);
      return edge.node.frontmatter.layout == null ||
        edge.node.frontmatter.layout == 'hidden'
        ? false
        : true;
    });

    postOrPage.forEach((edge) => {
      const id = edge.node.id;
      let pathName = edge.node.frontmatter.slug || edge.node.fields.slug;
      let component = path.resolve(
        `src/templates/${String(edge.node.frontmatter.layout)}.js`,
      );

      if (fs.existsSync(component)) {
        console.log(pathName);
        createPage({
          path: pathName,
          component,
          context: {
            id,
          },
        });
      }
    });
  });
};

exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions;
  const oldPage = Object.assign({}, page);
  if (page.path !== oldPage.path) {
    deletePage(oldPage);
    createPage(page);
  }
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
};

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        path: require.resolve('path-browserify'),
      },
      fallback: {
        fs: false,
      },
    },
  });
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const defs = `
  type MarkdownRemarkFrontmatterSeo @infer {
    title: String
    description: String
    image: File
  }`;
  createTypes(defs);
};
