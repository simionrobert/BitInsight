using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Watcher.Controllers
{
    public class BrowseController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}