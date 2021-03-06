﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace WTA.Schedules
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            // Core js
            bundles.Add(new ScriptBundle("~/Scripts/core").Include(
                "~/Scripts/jquery-1.9.0.min.js",
                "~/Scripts/jquery-ui.min.js",
                "~/Scripts/bootstrap.min.js",
                "~/Scripts/linq.min.js",
                "~/Scripts/main.js"));

            // Data js
            bundles.Add(new ScriptBundle("~/data/data").Include(
                "~/data/calendar.js",
                "~/data/calendar_dates.js",
                "~/data/routes.js",
                "~/data/stops.js",
                "~/data/stop_times.min.js",
                "~/data/trips.js",
                "~/data/notices.js"));


            // CSS
            bundles.Add(new StyleBundle("~/css/css").Include(
                "~/css/bootstrap.min.css",
                "~/css/bootstrap-custom.css",
                "~/css/font-awesome.min.css",
                "~/css/jquery-ui.min.css",
                "~/css/main.css"));
        }
    }
}