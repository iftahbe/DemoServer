﻿using System;
using System.Linq;
using DemoServer.Controllers;
using DemoServer.Entities;
using DemoServer.Helpers;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Raven.Client.Documents.Session;

namespace DemoServer.Demos.Basic
{
    public partial class BasicController : BaseController
    {
        [HttpGet]
        [Route("/basic/query1")]
        [Demo("Query I", DemoOutputType.Flatten, demoOrder: 40)]
        public object Query1(string country = "UK")
        {
            using (var session = DocumentStoreHolder.Store.OpenSession())
            {
                QueryStatistics stats;

                var query =
                    from company in session.Query<Company>().Statistics(out stats)
                    where company.Address.Country == country
                    select company;

                var result = query.FirstOrDefault();

                ServerTime = TimeSpan.FromMilliseconds(stats.DurationInMs);

                RecordQuery(query);

                return result;
            }
        }


        private void RecordQuery(object q)
        {
            try
            {
                var ravenQueryInspector = q as IRavenQueryInspector;
                if (ravenQueryInspector == null)
                    return;

                var indexQuery = ravenQueryInspector.GetIndexQuery(false);

                Response.Headers["Query"] = JsonConvert.SerializeObject(new
                {
                    indexQuery.Query,
                    indexQuery.QueryParameters
                });
            }
            catch (Exception)
            {
                // invalid header value, etc
            }
        }
    }
}

