package com.energy.energy_client.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.energy.energy_client.dto.SystemReportDTO;
import com.energy.energy_client.dto.WeeklyStatsDTO;
import com.energy.energy_client.service.EnergyGatewayService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FrontendController {

    private final EnergyGatewayService gatewayService;

    @GetMapping("/")
    public String showDashboard(Model model) {
        try {
            // 1. Fetch data from the remote server
            SystemReportDTO report = gatewayService.getFullReport();
            List<WeeklyStatsDTO> weeklyStats = gatewayService.getWeeklyStats();
            
            // 2. Pass data to Thymeleaf view
            model.addAttribute("report", report);
            model.addAttribute("weeklyStats", weeklyStats);
            
        } catch (Exception e) {
            // Handle connection errors (e.g., Server is down)
            model.addAttribute("error", "Backend Server is unreachable: " + e.getMessage());
        }
        return "dashboard";
    }

    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file, RedirectAttributes redirectAttributes) {
        try {
            // Delegate upload to the gateway
            String responseMessage = gatewayService.uploadCsvFile(file);
            redirectAttributes.addFlashAttribute("message", responseMessage);
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Upload failed: " + e.getMessage());
        }
        return "redirect:/";
    }
}