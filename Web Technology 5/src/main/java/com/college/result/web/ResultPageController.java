package com.college.result.web;

import com.college.result.dto.ResultForm;
import com.college.result.service.DuplicateRollNoException;
import com.college.result.service.ResultCalculator;
import com.college.result.service.ResultService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** Server-rendered (Thymeleaf) pages. */
@Controller
public class ResultPageController {

    private final ResultService resultService;
    private final String instituteName;

    public ResultPageController(ResultService resultService,
                                @Value("${app.institute-name:Institute of Engineering & Technology}") String instituteName) {
        this.resultService = resultService;
        this.instituteName = instituteName;
    }

    @ModelAttribute
    public void common(Model model) {
        model.addAttribute("instituteName", instituteName);
        model.addAttribute("mseWeight", (int) Math.round(ResultCalculator.MSE_WEIGHT * 100));
        model.addAttribute("eseWeight", (int) Math.round(ResultCalculator.ESE_WEIGHT * 100));
    }

    @GetMapping("/")
    public String dashboard(@RequestParam(required = false) String q, Model model) {
        model.addAttribute("active", "home");
        model.addAttribute("q", q);
        model.addAttribute("results", resultService.list(q));
        model.addAttribute("summary", resultService.summary());
        return "index";
    }

    @GetMapping("/results/new")
    public String newResult(Model model) {
        model.addAttribute("active", "new");
        model.addAttribute("form", resultService.blankForm());
        return "form";
    }

    @PostMapping("/results")
    public String create(@Valid @ModelAttribute("form") ResultForm form, BindingResult binding,
                         Model model, RedirectAttributes redirect) {
        model.addAttribute("active", "new");
        if (binding.hasErrors()) {
            resultService.refreshSubjectInfo(form);
            return "form";
        }
        try {
            Long id = resultService.create(form);
            redirect.addFlashAttribute("message", "Result saved for " + form.getName() + ".");
            return "redirect:/results/" + id;
        } catch (DuplicateRollNoException e) {
            binding.rejectValue("rollNo", "duplicate", e.getMessage());
        } catch (IllegalArgumentException e) {
            binding.reject("invalid", e.getMessage());
        }
        resultService.refreshSubjectInfo(form);
        return "form";
    }

    @GetMapping("/results/{id}")
    public String view(@PathVariable Long id, Model model) {
        model.addAttribute("r", resultService.get(id));
        return "result";
    }

    @GetMapping("/results/{id}/edit")
    public String edit(@PathVariable Long id, Model model) {
        model.addAttribute("form", resultService.formFor(id));
        model.addAttribute("editId", id);
        return "form";
    }

    @PostMapping("/results/{id}")
    public String update(@PathVariable Long id, @Valid @ModelAttribute("form") ResultForm form, BindingResult binding,
                         Model model, RedirectAttributes redirect) {
        model.addAttribute("editId", id);
        if (binding.hasErrors()) {
            resultService.refreshSubjectInfo(form);
            return "form";
        }
        try {
            resultService.update(id, form);
            redirect.addFlashAttribute("message", "Result updated.");
            return "redirect:/results/" + id;
        } catch (DuplicateRollNoException e) {
            binding.rejectValue("rollNo", "duplicate", e.getMessage());
        } catch (IllegalArgumentException e) {
            binding.reject("invalid", e.getMessage());
        }
        resultService.refreshSubjectInfo(form);
        return "form";
    }

    @PostMapping("/results/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirect) {
        resultService.delete(id);
        redirect.addFlashAttribute("message", "Result deleted.");
        return "redirect:/";
    }
}
