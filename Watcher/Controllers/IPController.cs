using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace Watcher.Controllers
{
    public class IPController : Controller
    {
        private ElasticSearchDB _databaseService;

        public IPController(ElasticSearchDB databaseService)
        {
            _databaseService = databaseService;
        }

        public IActionResult Index(String q)
        {
            IPModel ips = _databaseService.GetIP(q);

            return View(ips);
        }
    }
}