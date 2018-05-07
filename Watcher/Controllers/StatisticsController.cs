using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Watcher.Models;
using WatcherDataLayer;

namespace Watcher.Controllers
{
    public class StatisticsController : Controller
    {
        private ElasticSearchDB _databaseService;

        public StatisticsController(ElasticSearchDB databaseService)
        {
            _databaseService = databaseService;
        }

        public IActionResult Index()
        {
            return View();
        }

        public JsonResult GetDownloadedCategoryDistribution()
        {

            StatisticsModel model = new StatisticsModel();

            String[] categories = _databaseService.GetAllCategories();
            for(int i = 0; i < categories.Length; i++)
            {
                int value = _databaseService.GetTorrentCountByCategory(categories[i]);
                model.putEntry(categories[i], value);
            }

            return Json(model);
        }

        public JsonResult GetPopularityCategoryDistribution()
        {
            StatisticsModel model = new StatisticsModel();

            String[] categories = _databaseService.GetAllCategories();
            for (int i = 0; i < categories.Length; i++)
            {
                int value = _databaseService.GetTorrentPeerCountByCategory(categories[i]);
                model.putEntry(categories[i], value);
            }

            return Json(model);
        }
    }
}